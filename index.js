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

class Command {
  constructor(name, description, handler) {
    this.name = name;
    this.description = description;
    this.handler = handler;
  }
}

const ip = 'play.hampternom.nl';

const commandList = [
  new Command('!ping', 'Shows bot latency', async (message) => {
    message.reply(`latency: ${client.ws.ping} ms`);
  }),

  new Command('!ysu', '???', async (message) => {
    message.reply('wakka');
  }),

  new Command('!status', 'Shows server online/offline status', async (message) => {
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
  }),

  new Command('!players', 'List currently online players', async (message) => {
    try {
      const response = await sendRcon('list');
      message.reply(` ${response}`);
    } catch (err) {
      message.reply(' Could not connect to the Minecraft server');
    }
  }),

  new Command('!setstatusip', 'Checks status of inputed server ip after command', async (message) => {
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
  }),

  new Command('!help', 'Shows server commands', async (message) => {
    let helpText = '**Available Commands:**\n';
    commandList.forEach(cmd => {
      helpText += `\`${cmd.name}\` - ${cmd.description}\n`;
    });
    message.reply(helpText);
  }),

 new Command('!time', 'Shows the current in-game time', async (message) => {
  try {
    const response = await sendRcon('time query daytime');
    const ticks = parseInt(response.match(/\d+/)[0]);
    const hours = Math.floor((ticks / 1000 + 6) % 24);
    const minutes = Math.floor((ticks % 1000) * 60 / 1000);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMin = String(minutes).padStart(2, '0');

    const nightStart = 12000;
    let ticksUntil;
    let phase;

    if (ticks < nightStart) {
      ticksUntil = nightStart - ticks;
      phase = "night";
    } else {
      ticksUntil = 24000 - ticks;
      phase = "day";
    }

    const minutesUntil = Math.floor(ticksUntil / 1200);

    message.reply(
      `In-game time: ${displayHour}:${displayMin} ${ampm}\n` +
      ` ${minutesUntil} minutes until ${phase}`
    );

  } catch (err) {
    message.reply('Could not fetch in-game time');
  }
}),


  new Command('!wakka', '???', async (message) => {
    message.reply('ysu');
  }),

  new Command('!tps', 'Shows server TPS (performance)', async (message) => {
    try {
      const response = await sendRcon('tps');
      const stripped = response.replace(/§[0-9a-fk-or]/gi, '');
      message.reply(`${stripped}`);
    } catch {
      message.reply('could not fetch TPS');
    }
  }),

  new Command('!ip', 'Shows server ip', async (message) => {
    message.reply(`${ip}`);
  }),
];

const commandMap = new Map(commandList.map(cmd => [cmd.name, cmd]));

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== process.env.DISCORD_CHANNEL_ID) return;

    if (message.mentions.has(client.user)) {
    const responses = ['ysu', 'wakka'];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    return message.reply(reply);
  }

  if (!message.content.startsWith('!')) {
    try {
      await sendRcon(`say [Discord] ${message.author.username}: ${message.content}`);
    } catch (err) {
      console.error('RCON error:', err);
    }
  }

  const commandName = message.content.split(' ')[0].toLowerCase();
  const command = commandMap.get(commandName);
  if (command) await command.handler(message);
});

client.login(process.env.DISCORD_TOKEN);