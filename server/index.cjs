 const express = require('express');
 const cors = require('cors');
 const { chat, getMemory, saveMemory } = require('./agent.cjs');
 const { resolveGame } = require('./sui.cjs');
 const app = express();
 app.use(cors({ origin: '*' }));
 app.use(express.json());

 app.get('/api/health', (req, res) => res.json({ ok: true }));

 app.get('/api/memory/:address', async (req, res) => {
   res.json(await getMemory(req.params.address));
 });

 app.post('/api/chat', async (req, res) => {
   const { address, message } = req.body;
   try {
     const result = await chat(address, message);
     res.json(result);
   } catch (err) {
     console.error(err);
     res.status(500).json({ reply: "Frost glitched. Try again." });
   }
 });

 app.post('/api/play', async (req, res) => {
   const { address, won, playerPicks, agentPicks, team } = req.body;
   const memory = await getMemory(address);
   memory.gamesPlayed += 1;
   if (won) memory.wins += 1; else memory.losses += 1;
   (playerPicks || []).forEach(p => memory.kickHistory[p] = (memory.kickHistory[p] || 0) + 1);
   (agentPicks || []).forEach(p => memory.diveHistory[p] = (memory.diveHistory[p] || 0) + 1);
   memory.lastResult = won ? 'win' : 'loss';
   memory.favoriteTeam = team || memory.favoriteTeam;
   const blobId = await saveMemory(address, memory);
   res.json({ memory, blobId });
 });

 app.post('/api/resolve', async (req, res) => {
   const { gameId, winnerAddress } = req.body;
   try {
     const result = await resolveGame(gameId, winnerAddress);
     res.json({ ok: true, digest: result.digest });
   } catch (err) {
     console.error(err);
     res.status(500).json({ ok: false, error: err.message });
   }
 });

 const gameParticipants = {};

 app.post('/api/game/:gameId/joined', (req, res) => {
   const { gameId } = req.params;
   const { address } = req.body;
   if (!gameParticipants[gameId]) gameParticipants[gameId] = [];
   if (!gameParticipants[gameId].includes(address)) {
     gameParticipants[gameId].push(address);
   }
   res.json({ ok: true, participants: gameParticipants[gameId] });
 });

 app.get('/api/game/:gameId/participants', (req, res) => {
   res.json({ participants: gameParticipants[req.params.gameId] || [] });
 });


const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not found' });
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
