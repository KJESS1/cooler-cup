const { writeMemory, readMemory, defaultMemory } = require('./walrus.cjs');

const blobIdStore = new Map();

const MAX_STAKE_SUI = 5;
const pendingActions = {};

const FAUCETS = [
  { name: 'Official Sui Faucet', url: 'https://faucet.sui.io/' },
  { name: 'n1stake Faucet (backup)', url: 'https://faucet.n1stake.com/' },
];

async function getMemory(address) {
  try {
    const blobId = blobIdStore.get(`blobid:${address}`);
    return blobId ? await readMemory(blobId) : defaultMemory(address);
  } catch(e) {
    return defaultMemory(address);
  }
}

async function saveMemory(address, memory) {
  const blobId = await writeMemory(address, memory);
  blobIdStore.set(`blobid:${address}`, blobId);
  return blobId;
}

async function chat(address, userMessage) {
  const memory = await getMemory(address);

  if (pendingActions[address]) {
    const said = userMessage.trim().toLowerCase();
    const pending = pendingActions[address];
    if (said === 'yes' || said === 'confirm') {
      delete pendingActions[address];
      return await executeTool(address, memory, pending.tool, pending.input);
    } else if (said === 'no' || said === 'cancel') {
      delete pendingActions[address];
      return { reply: "Cancelled. Nothing was created or staked." };
    } else {
      return { reply: `Pending: ${pending.tool} (${JSON.stringify(pending.input)}). Reply "yes" to confirm or "no" to cancel.` };
    }
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are Frost, a cheeky AI football rival on Cooler Cup. User history: ${JSON.stringify(memory)}. 
          When user wants to create a game, extract the EXACT stake amount they mention (any number they say, in SUI). Respond with JSON: {"action":"create_game","stakeSui":<the number they actually said>,"reply":"your message"}. If they don't specify an amount, ask them how much before creating.
          When user wants a bet, respond with JSON like: {"action":"place_world_cup_bet","matchId":"m1","pick":"Brazil","stakeSui":2,"reply":"your message"}
          When user wants stats, respond with JSON like: {"action":"get_my_stats","reply":"your message"}
          When user needs tokens, respond with JSON like: {"action":"get_testnet_tokens","reply":"your message"}
          Otherwise just respond with JSON like: {"action":null,"reply":"your message"}
          ALWAYS respond with valid JSON only, no extra text.`
        },
        { role: 'user', content: userMessage }
      ],
    }),
  });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  
  let parsed;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch(e) {
    return { reply: raw || "Frost is thinking..." };
  }

  const { action, reply, ...input } = parsed;

  if (!action) return { reply };

  if (action === 'create_game' || action === 'place_world_cup_bet') {
    const stake = input.stakeSui;
    if (stake > MAX_STAKE_SUI) {
      return { reply: `${reply}\n\nThat's ${stake} SUI, above my ${MAX_STAKE_SUI} SUI cap. Try less.` };
    }
    pendingActions[address] = { tool: action, input };
    return { reply: `${reply}\n\nConfirm: ${action} for ${stake} SUI? Reply "yes" or "no".` };
  }

  return await executeTool(address, memory, action, input);
}

async function executeTool(address, memory, toolName, input) {
  if (toolName === 'get_my_stats') {
    return { reply: `Record: ${memory.wins}W-${memory.losses}L over ${memory.gamesPlayed} games.` };
  }
  if (toolName === 'get_testnet_tokens') {
    const linksText = FAUCETS.map(f => `${f.name}: ${f.url}`).join('\n');
    return { reply: `No SUI? Try these:\n${linksText}`, action: { type: 'show_faucets', faucets: FAUCETS } };
  }
  if (toolName === 'create_game') {
    return { reply: `Ready to create a ${input.stakeSui} SUI game. Approve in your wallet.`, action: { type: 'create_game', stakeSui: input.stakeSui } };
  }
  if (toolName === 'place_world_cup_bet') {
    return { reply: `Ready to stake ${input.stakeSui} SUI on ${input.pick}. Approve in your wallet.`, action: { type: 'place_world_cup_bet', ...input } };
  }
  return { reply: "Not sure how to do that yet." };
}

module.exports = { chat, getMemory, saveMemory };
