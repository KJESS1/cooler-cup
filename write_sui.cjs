const fs = require('fs');
const lines = [
"const { Transaction } = require('@mysten/sui/transactions');",
"const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');",
"const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');",
"",
"const client = new SuiClient({ url: getFullnodeUrl('testnet') });",
"const adminKeypair = Ed25519Keypair.fromSecretKey(process.env.ADMIN_PRIVATE_KEY);",
"",
"async function resolveGame(gameId, winnerAddress) {",
"  const tx = new Transaction();",
"  tx.moveCall({",
"    target: `${process.env.PACKAGE_ID}::game_escrow::resolve_game`,",
"    arguments: [tx.object(process.env.ADMIN_CAP_ID), tx.object(gameId), tx.pure.address(winnerAddress)],",
"  });",
"  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx, options: { showEffects: true } });",
"}",
"",
"async function houseJoinGame(gameId, stakeMist) {",
"  const tx = new Transaction();",
"  const [coin] = tx.splitCoins(tx.gas, [stakeMist]);",
"  tx.moveCall({",
"    target: `${process.env.PACKAGE_ID}::game_escrow::join_game`,",
"    arguments: [tx.object(gameId), coin],",
"  });",
"  return client.signAndExecuteTransaction({ signer: adminKeypair, transaction: tx, options: { showEffects: true } });",
"}",
"",
"module.exports = { resolveGame, houseJoinGame };",
""
];
fs.mkdirSync('server', { recursive: true });
fs.writeFileSync('server/sui.js', lines.join('\n'));
console.log('server/sui.js written, length:', lines.join('\n').length);
