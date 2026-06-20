let clientPromise = null;

async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const { Transaction } = await import('@mysten/sui/transactions');
    const { SuiGrpcClient } = await import('@mysten/sui/grpc');
    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');

    const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });
    const adminKeypair = Ed25519Keypair.fromSecretKey(process.env.ADMIN_PRIVATE_KEY);
    return { Transaction, client, adminKeypair };
  })();
  return clientPromise;
}

async function resolveGame(gameId, winnerAddress) {
  const { Transaction, client, adminKeypair } = await getClient();
  const tx = new Transaction();
  tx.moveCall({
    target: `${process.env.PACKAGE_ID}::game_escrow::resolve_game`,
    arguments: [tx.object(process.env.ADMIN_CAP_ID), tx.object(gameId), tx.pure.address(winnerAddress)],
  });
  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx });
}

async function houseJoinGame(gameId, stakeMist) {
  const { Transaction, client, adminKeypair } = await getClient();
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [stakeMist]);
  tx.moveCall({
    target: `${process.env.PACKAGE_ID}::game_escrow::join_game`,
    arguments: [tx.object(gameId), coin],
  });
  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx });
}

module.exports = { resolveGame, houseJoinGame };
