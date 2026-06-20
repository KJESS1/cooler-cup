let clientPromise = null;

async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const { SuiGrpcClient } = await import('@mysten/sui/grpc');
    const { walrus } = await import('@mysten/walrus');
    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');

    const baseClient = new SuiGrpcClient({ network: 'mainnet', baseUrl: 'https://fullnode.mainnet.sui.io:443' });
    const client = baseClient.$extend(walrus({ network: 'mainnet' }));
    const walrusKeypair = Ed25519Keypair.fromSecretKey(process.env.WALRUS_WALLET_KEY);
    return { client, walrusKeypair };
  })();
  return clientPromise;
}

function defaultMemory(address) {
  return {
    address, gamesPlayed: 0, wins: 0, losses: 0,
    kickHistory: {}, diveHistory: {}, favoriteTeam: null,
    lastResult: null, bets: [], notes: []
  };
}

async function writeMemory(address, memory) {
  const { client, walrusKeypair } = await getClient();
  const bytes = new TextEncoder().encode(JSON.stringify(memory));
  const { blobId } = await client.walrus.writeBlob({
    blob: bytes, deletable: true, epochs: 3, signer: walrusKeypair,
  });
  return blobId;
}

async function readMemory(blobId) {
  const { client } = await getClient();
  const bytes = await client.walrus.readBlob({ blobId });
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

module.exports = { writeMemory, readMemory, defaultMemory };
