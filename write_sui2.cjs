const fs = require('fs');
const lines = [
"const { Transaction } = require('@mysten/sui/transactions');",
"const { SuiGrpcClient } = require('@mysten/sui/grpc');",
"const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');",
"",
"const client = new SuiGrpcClient({ network: 'testnet', baseUrl: 'https://fullnode.testnet.sui.io:443' });",
"const adminKeypair = Ed25519Keypair.fromSecretKey(process.env.ADMIN_PRIVATE_KEY);",
"",
"async function resolveGame(gameId, winnerAddress) {",
"  const tx = new Transaction();",
"  tx.moveCall({",
"    target: `${process.env.PACKAGE_ID}::game_escrow::resolve_game`,",
"    arguments: [tx.object(process.env.ADMIN_CAP_ID), tx.object(gameId), tx.pure.address(winnerAddress)],",
"  });",
"  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx });",
"}",
"",
"async function houseJoinGame(gameId, stakeMist) {",
"  const tx = new Transaction();",
"  const [coin] = tx.splitCoins(tx.gas, [stakeMist]);",
"  tx.moveCall({",
"    target: `${process.env.PACKAGE_ID}::game_escrow::join_game`,",
"    arguments: [tx.object(gameId), coin],",
"  });",
"  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx });",
"}",
"",
"module.exports = { resolveGame, houseJoinGame };",
""
];
fs.writeFileSync('server/sui.cjs', lines.join('\n'));
console.log('server/sui.cjs rewritten, length:', lines.join('\n').length);
