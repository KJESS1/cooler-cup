import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { logger } from './logger.js';

const NETWORK = (process.env.SUI_NETWORK as 'mainnet' | 'testnet') ?? 'testnet';

let _client: SuiJsonRpcClient | null = null;
let _keypair: Ed25519Keypair | null = null;

function getClient(): SuiJsonRpcClient {
  if (!_client) _client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(NETWORK) });
  return _client;
}

function getKeypair(): Ed25519Keypair {
  if (!_keypair) {
    const key = process.env.ADMIN_PRIVATE_KEY;
    if (!key) throw new Error('ADMIN_PRIVATE_KEY not set');
    _keypair = Ed25519Keypair.fromSecretKey(key);
  }
  return _keypair;
}

export async function resolveGame(suiGameId: string, winner: string): Promise<string> {
  const packageId = process.env.PACKAGE_ID;
  const adminCapId = process.env.ADMIN_CAP_ID;
  if (!packageId || !adminCapId) throw new Error('PACKAGE_ID or ADMIN_CAP_ID not set');

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::game_escrow::resolve_game`,
    arguments: [tx.object(adminCapId), tx.object(suiGameId), tx.pure.address(winner)],
  });

  const client = getClient();
  const keypair = getKeypair();
  const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
  logger.info({ digest: result.digest, suiGameId, winner }, 'Sui game resolved');
  return result.digest;
}

export async function houseJoinGame(suiGameId: string, stakeAmount: number): Promise<string> {
  const packageId = process.env.PACKAGE_ID;
  if (!packageId) throw new Error('PACKAGE_ID not set');

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [stakeAmount]);
  tx.moveCall({
    target: `${packageId}::game_escrow::join_game`,
    arguments: [tx.object(suiGameId), coin],
  });

  const client = getClient();
  const keypair = getKeypair();
  const result = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx });
  logger.info({ digest: result.digest, suiGameId }, 'House joined game');
  return result.digest;
}
