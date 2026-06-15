import { Router } from 'express';
import { getMemoryPointer, setMemoryPointer, defaultMemory } from '../lib/store.js';
import { readMemory, writeMemory, aggregatorUrl } from '../lib/walrus.js';
import type { PlayerMemory } from '../lib/types.js';

const router = Router();

router.get('/:address', async (req, res) => {
  const { address } = req.params;
  const blobId = await getMemoryPointer(address);

  if (!blobId) {
    res.json({ memory: defaultMemory(address), blobId: null, aggregatorUrl: null });
    return;
  }

  try {
    const memory = await readMemory(blobId);
    res.json({ memory, blobId, aggregatorUrl: aggregatorUrl(blobId) });
  } catch (err: any) {
    req.log.warn({ err, blobId }, 'Could not read Walrus blob — returning default');
    res.json({ memory: defaultMemory(address), blobId: null, aggregatorUrl: null });
  }
});

router.put('/:address', async (req, res) => {
  const { address } = req.params;
  const memory = req.body as PlayerMemory;

  if (!memory || memory.address !== address) {
    res.status(400).json({ error: 'Memory body must include matching address' });
    return;
  }

  try {
    const blobId = await writeMemory(memory);
    await setMemoryPointer(address, blobId);
    res.json({ blobId, aggregatorUrl: aggregatorUrl(blobId) });
  } catch (err: any) {
    req.log.error({ err }, 'Walrus write failed');
    res.status(500).json({ error: err.message ?? 'Walrus error' });
  }
});

router.patch('/:address/record', async (req, res) => {
  const { address } = req.params;
  const { outcome } = req.body as { outcome: 'win' | 'loss' };
  if (!outcome) { res.status(400).json({ error: 'outcome required' }); return; }

  const blobId = await getMemoryPointer(address);
  let memory: PlayerMemory = defaultMemory(address);
  if (blobId) {
    try { memory = await readMemory(blobId); } catch { /* keep default */ }
  }

  memory.gamesPlayed += 1;
  if (outcome === 'win') memory.wins += 1;
  else memory.losses += 1;

  const { kickZones, diveZones } = req.body as {
    kickZones?: string[];
    diveZones?: string[];
  };
  for (const z of kickZones ?? []) {
    const zone = z as keyof typeof memory.kickHistory;
    memory.kickHistory[zone] = (memory.kickHistory[zone] ?? 0) + 1;
  }
  for (const z of diveZones ?? []) {
    const zone = z as keyof typeof memory.diveHistory;
    memory.diveHistory[zone] = (memory.diveHistory[zone] ?? 0) + 1;
  }

  try {
    const newBlobId = await writeMemory(memory);
    await setMemoryPointer(address, newBlobId);
    res.json({ memory, blobId: newBlobId, aggregatorUrl: aggregatorUrl(newBlobId) });
  } catch (err: any) {
    req.log.error({ err }, 'Walrus record update failed');
    res.status(500).json({ error: err.message ?? 'Walrus error' });
  }
});

export default router;
