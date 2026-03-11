require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Rcon } = require('rcon-client');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function sendRcon(command) {
  const rcon = new Rcon({
    host: process.env.RCON_HOST,
    port: Number(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD
  });
  await rcon.connect();
  const response = await rcon.send(command);
  await rcon.end();
  return response;
}

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

  if (!message.content.startsWith('!')) {
    try {
      await sendRcon(`say [Discord] ${message.author.username}: ${message.content}`);
    } catch (err) {
      console.error('RCON error:', err);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);