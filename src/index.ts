import { Client, GatewayIntentBits } from 'discord.js';
import NodeCache from 'node-cache';
import { commandList } from './commandlist';

require('dotenv').config();

const client = new Client({ intents: 
  [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});
client.on('ready', () => {
  console.log('I am ready!');
});

// Gateway lifecycle logging.
// The bot has exited cleanly (code 0) with no output at all; nothing here
// calls process.exit(0) or client.destroy(), so the event loop must be
// draining after the websocket goes away. These listeners make that visible.
// journalctl already stamps each line with a time, so we don't add one.
client.on('error', (err) => {
  console.error('Client error:', err);
});

client.on('warn', (info) => {
  console.warn('Client warning:', info);
});

client.on('shardError', (err, shardId) => {
  console.error(`Shard ${shardId} error:`, err);
});

client.on('shardDisconnect', (event, shardId) => {
  // event.code is the diagnostic that matters: 1006 = abnormal close,
  // 4004 = auth failed, 4014 = disallowed intents, etc.
  console.error(`Shard ${shardId} DISCONNECTED - code=${event.code} reason="${event.reason || '(none)'}" wasClean=${event.wasClean}`);
});

client.on('shardReconnecting', (shardId) => {
  console.warn(`Shard ${shardId} reconnecting...`);
});

client.on('shardResume', (shardId, replayedEvents) => {
  console.log(`Shard ${shardId} resumed (${replayedEvents} events replayed)`);
});

client.on('shardReady', (shardId) => {
  console.log(`Shard ${shardId} ready`);
});

client.on('invalidated', () => {
  // discord.js destroys the client here and hands shutdown to us. Left alone
  // it means a silent exit 0, which systemd reads as success. Exit 1 instead.
  console.error('Session INVALIDATED - client destroyed by discord.js. Exiting 1 so systemd restarts.');
  process.exit(1);
});

const cache = new NodeCache();

client.on('messageCreate', (msg) => {
  const commands = commandList.filter((command) => command.trigger(msg));
  Promise.all(commands.map(async (command) => {
    await command.command(msg, { cache });
  })).catch((e) => console.error('Unhandled command error:', e));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// beforeExit fires only when the event loop empties on its own; an explicit
// process.exit() skips it. So if this line shows up in the journal, the silent
// shutdown is confirmed as the drain path and not an error exit.
process.on('beforeExit', (code) => {
  console.error(`beforeExit (code ${code}) - event loop is empty, nothing left to keep the process alive. The gateway connection is gone.`);
});

process.on('exit', (code) => {
  console.log(`Process exiting with code ${code}`);
});

client.login(process.env.TOKEN);
