import { Router } from 'express';
import { askFrost, agentDiveChoice, agentKickChoice } from '../lib/agent.js';
import { getMemoryPointer, defaultMemory } from '../lib/store.js';
import { readMemory } from '../lib/walrus.js';
import type { PlayerMemory } from '../lib/types.js';

const router = Router();

router.post('/commentary', async (req, res) => {
  const { address, context } = req.body as { address: string; context: string };
  if (!address || !context) {
    res.status(400).json({ error: 'address and context are required' });
    return;
  }

  let memory: PlayerMemory = defaultMemory(address);
  const blobId = await getMemoryPointer(address);
  if (blobId) {
    try { memory = await readMemory(blobId); } catch { /* use default */ }
  }

  try {
    const line = await askFrost(memory, context);
    res.json({ line });
  } catch (err: any) {
    req.log.error({ err }, 'Frost commentary failed');
    res.status(500).json({ error: err.message ?? 'Agent error' });
  }
});

router.post('/move', async (req, res) => {
  const { address, type } = req.body as { address: string; type: 'kick' | 'dive' };
  if (!address || !type) {
    res.status(400).json({ error: 'address and type (kick|dive) are required' });
    return;
  }

  let memory: PlayerMemory = defaultMemory(address);
  const blobId = await getMemoryPointer(address);
  if (blobId) {
    try { memory = await readMemory(blobId); } catch { /* use default */ }
  }

  const zone = type === 'kick' ? agentKickChoice(memory) : agentDiveChoice(memory);
  res.json({ zone });
});

export default router;
