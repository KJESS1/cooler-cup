const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { WalrusClient } = require('@mysten/walrus');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');

const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
const walrusClient = new WalrusClient({ network: 'mainnet', suiClient });
const walrusKeypair = Ed25519Keypair.fromSecretKey(process.env.WALRUS_WALLET_KEY);

function defaultMemory(address) {
  return {
    address, gamesPlayed: 0, wins: 0, losses: 0,
    kickHistory: {}, diveHistory: {}, favoriteTeam: null,
    lastResult: null, bets: [], notes: []
  };
}

async function writeMemory(address, memory) {
  const bytes = new TextEncoder().encode(JSON.stringify(memory));
  const result = await walrusClient.writeBlob({
    blob: bytes, deletable: true, epochs: 3, signer: walrusKeypair,
  });
  return result.blobId;
}

async function readMemory(blobId) {
  const bytes = await walrusClient.readBlob({ blobId });
  return JSON.parse(new TextDecoder().decode(bytes));
}

module.exports = { writeMemory, readMemory, defaultMemory };
