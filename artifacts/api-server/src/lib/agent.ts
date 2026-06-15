import type { PlayerMemory, Zone } from './types.js';

type ZoneWeights = Partial<Record<Zone, number>>;

export function agentDiveChoice(memory: PlayerMemory): Zone {
  const zones: Zone[] = ['TL', 'TR', 'BL', 'BR', 'C'];
  const weights = zones.map((z) => (memory.kickHistory[z] ?? 1) as number);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < zones.length; i++) {
    r -= weights[i];
    if (r <= 0) return zones[i];
  }
  return zones[Math.floor(Math.random() * zones.length)];
}

export function agentKickChoice(memory: PlayerMemory): Zone {
  const zones: Zone[] = ['TL', 'TR', 'BL', 'BR', 'C'];
  const weights = zones.map((z) => {
    const diveFreq = memory.diveHistory[z] ?? 1;
    return Math.max(1, 6 - diveFreq);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < zones.length; i++) {
    r -= weights[i];
    if (r <= 0) return zones[i];
  }
  return zones[Math.floor(Math.random() * zones.length)];
}

export async function askFrost(memory: PlayerMemory, context: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "I'd say something clever, but my brain's offline. Good luck anyway.";
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are "Frost," a cheeky AI football rival on Cooler Cup.
Player memory: ${JSON.stringify(memory)}
Context: ${context}
Reply in 1-2 short, playful sentences referencing their history if relevant.`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  return data.content.find((c) => c.type === 'text')?.text ?? "Let's play.";
}
