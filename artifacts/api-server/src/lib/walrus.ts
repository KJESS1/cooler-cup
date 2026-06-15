import type { PlayerMemory } from './types.js';
import { logger } from './logger.js';

const PUBLISHER_URL = process.env.WALRUS_PUBLISHER_URL;
const PUBLISHER_KEY = process.env.WALRUS_PUBLISHER_KEY;
const AGGREGATOR_URL =
  process.env.WALRUS_AGGREGATOR_URL ?? 'https://aggregator.walrus-mainnet.walrus.space/v1/blobs';

export async function writeMemory(memory: PlayerMemory): Promise<string> {
  if (!PUBLISHER_URL || !PUBLISHER_KEY) {
    throw new Error('Walrus publisher not configured (WALRUS_PUBLISHER_URL / WALRUS_PUBLISHER_KEY)');
  }
  const res = await fetch(PUBLISHER_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${PUBLISHER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memory),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walrus write failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    newlyCreated?: { blobObject: { blobId: string } };
    alreadyCertified?: { blobId: string };
  };
  const blobId = data.newlyCreated?.blobObject?.blobId ?? data.alreadyCertified?.blobId;
  if (!blobId) throw new Error('Walrus response missing blobId');
  logger.info({ blobId, address: memory.address }, 'Walrus memory written');
  return blobId;
}

export async function readMemory(blobId: string): Promise<PlayerMemory> {
  const res = await fetch(`${AGGREGATOR_URL}/${blobId}`);
  if (!res.ok) throw new Error(`Walrus read failed ${res.status}`);
  return res.json() as Promise<PlayerMemory>;
}

export function aggregatorUrl(blobId: string): string {
  return `${AGGREGATOR_URL}/${blobId}`;
}
