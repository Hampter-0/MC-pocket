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

const ip = 'play.hampternom.nl';

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

  if (message.content === '!status') {
    try {
      const res = await fetch('https://api.mcsrvstat.us/3/' + ip);
      const data = await res.json();
      if (data.online) {
        message.reply(` Server is online with ${data.players.online}/${data.players.max} players!`);
      } else {
        message.reply(' Server is offline.');
      }
    } catch (err) {
      console.error('Status error:', err);
      message.reply('could not fetch server status');
    }
  }

  if (message.content === '!players') {
    try {
      const response = await sendRcon('list');
      message.reply(` ${response}`);
    } catch (err) {
      message.reply(' Could not connect to the Minecraft server');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);