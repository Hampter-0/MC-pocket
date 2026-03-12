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

const commands = {
  '!help': 'Shows server commands',
  '!status': 'Shows server online/offline status',
  '!players': 'Lists currently online players',
  '!setstatusip': 'Checks status of inputed server ip after command',
  '!ysu': '???',
  '!wakka': '???',
};

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

  if (message.content === '!ysu') message.reply('wakka');
  if (message.content === '!wakka') message.reply('ysu');

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

  if (message.content.startsWith('!setstatusip')) {
    const input = message.content.slice('!setstatusip'.length).trim();
    try {
      const res = await fetch('https://api.mcsrvstat.us/3/' + input);
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

  if (message.content === '!help') {
    let helpText = '**Available Commands:**\n';
    Object.entries(commands).forEach(([cmd, desc]) => {
      helpText += `\`${cmd}\` -${desc}\n`;
    });
    message.reply(helpText);
  }
});

client.login(process.env.DISCORD_TOKEN);