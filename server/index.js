const express = require('express');
const cors = require('cors');
const Database = require('@replit/database');

const app = express();
const db = new Database();
app.use(cors());
app.use(express.json());

function defaultMemory(address) {
  return {
    address,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    kickHistory: {},
    diveHistory: {},
    lastResult: null,
    notes: []
  };
}

// Get a player's memory (e.g. on app load)
app.get('/api/memory/:address', async (req, res) => {
  const mem = await db.get(`memory:${req.params.address}`) || defaultMemory(req.params.address);
  res.json(mem);
});

// Agent greets the player on session start, referencing their history
app.get('/api/greet/:address', async (req, res) => {
  const mem = await db.get(`memory:${req.params.address}`) || defaultMemory(req.params.address);
  const greeting = mem.gamesPlayed === 0
    ? "First time facing Frost, huh? Let's see what you've got."
    : await askAgent(mem, null, true);
  res.json({ greeting, memory: mem });
});

// Called after each vs-agent game finishes
app.post('/api/play', async (req, res) => {
  const { address, won, playerPicks, agentPicks } = req.body;
  let mem = await db.get(`memory:${address}`) || defaultMemory(address);

  mem.gamesPlayed += 1;
  if (won) mem.wins += 1; else mem.losses += 1;
  playerPicks.forEach(p => mem.kickHistory[p] = (mem.kickHistory[p] || 0) + 1);
  agentPicks.forEach(p => mem.diveHistory[p] = (mem.diveHistory[p] || 0) + 1);
  mem.lastResult = won ? 'win' : 'loss';

  const agentMessage = await askAgent(mem, won);
  mem.notes.push(agentMessage);
  if (mem.notes.length > 10) mem.notes.shift();

  await db.set(`memory:${address}`, mem);
  res.json({ memory: mem, agentMessage });
});

async function askAgent(memory, justWon, isGreeting = false) {
  const prompt = isGreeting
    ? `You are "Frost," a cheeky AI football rival in a penalty-shootout game called Cooler Cup.
This player is returning. Their history: ${JSON.stringify(memory)}.
Greet them in 1-2 short sentences, referencing something SPECIFIC from their history
(their record, a corner they favor, or their last result). Playful, not generic.`
    : `You are "Frost," a cheeky AI football rival. The player just ${justWon ? 'beat' : 'lost to'} you.
Their full history: ${JSON.stringify(memory)}.
React in 1-2 short sentences, referencing a SPECIFIC pattern from their history. Playful.`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await r.json();
  return data.content?.find(c => c.type === 'text')?.text ?? "...";
}

app.listen(3000, () => console.log('Server running on port 3000'));