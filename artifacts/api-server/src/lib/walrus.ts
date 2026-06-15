import { WalrusClient } from '@mysten/walrus';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { PlayerMemory } from './types.js';
import { logger } from './logger.js';

let _walrusClient: WalrusClient | null = null;
let _keypair: Ed25519Keypair | null = null;

function getWalrusClient(): WalrusClient {
  if (!_walrusClient) {
    const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('mainnet') });
    _walrusClient = new WalrusClient({ network: 'mainnet', suiClient });
  }
  return _walrusClient;
}

function getWalrusKeypair(): Ed25519Keypair {
  if (!_keypair) {
    const key = process.env.WALRUS_WALLET_KEY;
    if (!key) throw new Error('WALRUS_WALLET_KEY not set');
    _keypair = Ed25519Keypair.fromSecretKey(key);
  }
  return _keypair;
}

const AGGREGATOR = 'https://aggregator.walrus-mainnet.walrus.space/v1/blobs';

export async function writeMemory(memory: PlayerMemory): Promise<string> {
  const client = getWalrusClient();
  const keypair = getWalrusKeypair();
  const blob = new TextEncoder().encode(JSON.stringify(memory));

  const { blobId } = await client.writeBlob({
    blob,
    epochs: 3,
    deletable: true,
    signer: keypair,
  });

  logger.info({ blobId, address: memory.address }, 'Walrus memory written');
  return blobId;
}

export async function readMemory(blobId: string): Promise<PlayerMemory> {
  const client = getWalrusClient();
  const { bytes } = await client.readBlob({ blobId });
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as PlayerMemory;
}

export function aggregatorUrl(blobId: string): string {
  return `${AGGREGATOR}/${blobId}`;
}
