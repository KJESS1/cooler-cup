const { writeMemory, readMemory, defaultMemory } = require('./walrus');
const Database = require('@replit/database');
const db = new Database();

const MAX_STAKE_SUI = 5; // hard cap per single action, in SUI (adjust as you like)
const pendingActions = {}; // address -> pending tool call awaiting confirmation

const TOOLS = [
  {
    name: 'create_game',
    description: 'Create a new 1v1 wagered game and get a join code to share with a friend.',
    input_schema: {
      type: 'object',
      properties: { stakeSui: { type: 'number', description: 'Stake amount in SUI' } },
      required: ['stakeSui'],
    },
  },
  {
    name: 'place_world_cup_bet',
    description: 'Add the user to a World Cup match staking list with a pick and stake.',
    input_schema: {
      type: 'object',
      properties: {
        matchId: { type: 'string' },
        pick: { type: 'string', description: 'Team name predicted to win' },
        stakeSui: { type: 'number' },
      },
      required: ['matchId', 'pick', 'stakeSui'],
    },
  },
  {
    name: 'get_my_stats',
    description: "Read back the user's saved game history and record.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_testnet_tokens',
    description: 'Give the user faucet links to get free testnet SUI when they have none or are low on balance.',
    input_schema: { type: 'object', properties: {} },
  },
];

const FAUCETS = [
  { name: 'Official Sui Faucet', url: 'https://faucet.sui.io/' },
  { name: 'n1stake Faucet (backup, try if official is rate-limited)', url: 'https://faucet.n1stake.com/' },
];

async function getMemory(address) {
  const blobId = await db.get(`blobid:${address}`);
  return blobId ? await readMemory(blobId) : defaultMemory(address);
}

async function saveMemory(address, memory) {
  const blobId = await writeMemory(address, memory);
  await db.set(`blobid:${address}`, blobId);
  return blobId;
}

async function chat(address, userMessage) {
  const memory = await getMemory(address);

  // If there's a pending money-moving action awaiting confirmation, check for yes/no first
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
      return { reply: `You still have a pending action: ${pending.tool} (${JSON.stringify(pending.input)}). Reply "yes" to confirm or "no" to cancel.` };
    }
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are Frost, a cheeky AI football rival on Cooler Cup. The user's saved
history: ${JSON.stringify(memory)}. Reference specifics from it when relevant. You can use
tools to create games, place World Cup bets, or check stats. Be playful but clear about money.`,
      messages: [{ role: 'user', content: userMessage }],
      tools: TOOLS,
    }),
  });
  const data = await res.json();
  const toolUse = data.content?.find(c => c.type === 'tool_use');
  const text = data.content?.find(c => c.type === 'text')?.text ?? '';

  if (!toolUse) return { reply: text };

  // Money-moving tools require confirmation if they touch stake amounts
  if ((toolUse.name === 'create_game' || toolUse.name === 'place_world_cup_bet')) {
    const stake = toolUse.input.stakeSui;
    if (stake > MAX_STAKE_SUI) {
      return { reply: `${text}\n\nThat's ${stake} SUI, above my ${MAX_STAKE_SUI} SUI per-action cap. Try a smaller amount.` };
    }
    pendingActions[address] = { tool: toolUse.name, input: toolUse.input };
    return { reply: `${text}\n\nConfirm: ${toolUse.name} for ${stake} SUI? Reply "yes" to proceed or "no" to cancel.` };
  }

  return await executeTool(address, memory, toolUse.name, toolUse.input);
}

async function executeTool(address, memory, toolName, input) {
  if (toolName === 'get_my_stats') {
    return { reply: `Record: ${memory.wins}W-${memory.losses}L over ${memory.gamesPlayed} games.` };
  }
  if (toolName === 'get_testnet_tokens') {
    const linksText = FAUCETS.map(f => `${f.name}: ${f.url}`).join('\n');
    return {
      reply: `No SUI? No problem, it's free on testnet. Try these:\n${linksText}`,
      action: { type: 'show_faucets', faucets: FAUCETS },
    };
  }
  if (toolName === 'create_game') {
    // Frontend should actually trigger the real create_game transaction for the user to
    // sign (the user's own wallet pays the stake — the agent cannot sign on their behalf).
    return {
      reply: `Ready to create a ${input.stakeSui} SUI game. Approve the transaction in your wallet to finish.`,
      action: { type: 'create_game', stakeSui: input.stakeSui },
    };
  }
  if (toolName === 'place_world_cup_bet') {
    return {
      reply: `Ready to stake ${input.stakeSui} SUI on ${input.pick} for match ${input.matchId}. Approve in your wallet.`,
      action: { type: 'place_world_cup_bet', ...input },
    };
  }
  return { reply: "Not sure how to do that yet." };
}

module.exports = { chat, getMemory, saveMemory };
