import { INITIAL_RESOURCES } from '@/lib/store/demo-data';
import { Resource } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

interface SmartMatchItem {
  resource: Resource;
  relevanceScore: number;
  matchReason: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query, userDepartment, allResources = INITIAL_RESOURCES } = await req.json();

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ matches: [] });
    }

    const cleanQuery = query.toLowerCase().trim();
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try Gemini API if key is present
    if (geminiKey && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are LabLend's smart campus equipment match assistant.
A university member asked: "${query}".
The member's academic department is: "${userDepartment || 'General'}".

Here is the inventory of campus resources in JSON:
${JSON.stringify(
  allResources.map((r: Resource) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    keywords: r.keywords,
    department_restriction: r.department_restriction,
  }))
)}

Return a strict JSON array of objects representing matching resources ordered by relevance (best match first, maximum 4 matches).
Format:
[
  {
    "id": "resource_id",
    "relevanceScore": 95,
    "matchReason": "Short 1-sentence explanation of why this equipment fits their request"
  }
]
Output ONLY valid raw JSON array, no markdown fences.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const matches: SmartMatchItem[] = parsed
            .map((item: { id: string; relevanceScore: number; matchReason: string }) => {
              const res = allResources.find((r: Resource) => r.id === item.id);
              if (!res) return null;
              return {
                resource: res,
                relevanceScore: item.relevanceScore || 80,
                matchReason: item.matchReason || 'Matches your task criteria.',
              };
            })
            .filter((item): item is SmartMatchItem => item !== null);

          return NextResponse.json({
            matches,
            source: 'gemini-1.5-flash',
          });
        }
      } catch (geminiError) {
        console.warn('Gemini smart match fallback triggered:', geminiError);
        // Graceful fallback to rule-based engine below
      }
    }

    // 2. Rule-based fuzzy matching fallback
    const matches: SmartMatchItem[] = [];

    const synonymMap: Record<string, string[]> = {
      signal: ['oscilloscope', 'keysight', 'frequency', 'hardware'],
      measure: ['oscilloscope', 'testing devices', 'keysight', 'fpga'],
      print: ['3d printer', 'stratasys', 'fdm', 'additive', 'rapid prototyping'],
      '3d': ['3d printer', 'stratasys', 'cad', 'additive'],
      camera: ['dslr', 'sony', 'video', 'lens', 'cinematography', 'podcast'],
      video: ['camera', 'dslr', 'sony', 'media studio'],
      photo: ['camera', 'dslr', 'sony'],
      cut: ['laser cutter', 'trotec', 'acrylic', 'wood', 'engraving'],
      laser: ['laser cutter', 'trotec'],
      wood: ['laser cutter'],
      acrylic: ['laser cutter'],
      room: ['seminar room', 'meeting room', 'presentation', 'defense'],
      presentation: ['seminar room', 'meeting room', 'interactive display'],
      meeting: ['seminar room'],
      defense: ['seminar room'],
      fpga: ['embedded', 'xilinx', 'fpga', 'verilog'],
      circuit: ['soldering', 'pcb', 'oscilloscope', 'embedded'],
      solder: ['soldering station', 'weller', 'pcb', 'rework', 'smd'],
      pcb: ['soldering station', 'oscilloscope', 'embedded'],
      vr: ['meta quest', 'vive', 'vr', 'xr', 'mixed reality'],
      quest: ['vr', 'meta quest'],
    };

    allResources.forEach((res: Resource) => {
      let score = 0;
      const reasons: string[] = [];

      const targetText = `${res.name} ${res.category} ${res.description} ${res.keywords.join(' ')}`.toLowerCase();

      // Direct keyword hits
      const queryWords = cleanQuery.split(/\s+/);
      queryWords.forEach((word) => {
        if (word.length < 3) return;
        if (targetText.includes(word)) {
          score += 30;
          reasons.push(`matches "${word}"`);
        }

        // Synonym hits
        Object.entries(synonymMap).forEach(([synKeyword, mappedTerms]) => {
          if (word.includes(synKeyword) || synKeyword.includes(word)) {
            mappedTerms.forEach((term) => {
              if (targetText.includes(term)) {
                score += 25;
                if (!reasons.includes(`suited for ${synKeyword}`)) {
                  reasons.push(`suited for ${synKeyword}`);
                }
              }
            });
          }
        });
      });

      // Boost if category directly matches
      if (cleanQuery.includes(res.category.toLowerCase())) {
        score += 35;
        reasons.push(`in category "${res.category}"`);
      }

      if (score > 0) {
        matches.push({
          resource: res,
          relevanceScore: Math.min(98, 40 + score),
          matchReason: `Recommended because it ${reasons.slice(0, 2).join(' and ')}.`,
        });
      }
    });

    matches.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      matches: matches.slice(0, 4),
      source: 'rule-engine-fallback',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error in smart match';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
