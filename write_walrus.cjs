const fs = require('fs');
const content = `const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { WalrusClient, WalrusFile } = require('@mysten/walrus');
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
  const file = WalrusFile.from({
    contents: new TextEncoder().encode(JSON.stringify(memory)),
    identifier: \\\`memory-\\\${address}.json\\\`,
  });
  const [result] = await walrusClient.writeFiles({
    files: [file], epochs: 3, deletable: true, signer: walrusKeypair,
  });
  return result.blobId;
}

async function readMemory(blobId) {
  const [file] = await walrusClient.readFiles({ ids: [blobId] });
  const text = new TextDecoder().decode(await file.bytes());
  return JSON.parse(text);
}

module.exports = { writeMemory, readMemory, defaultMemory };
`;
fs.mkdirSync('server', { recursive: true });
fs.writeFileSync('server/walrus.js', content);
console.log('server/walrus.js written, length:', content.length);
