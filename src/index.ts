import { Client, GatewayIntentBits, Collection, Interaction } from 'discord.js';
import { Player } from 'discord-player';
import { DefaultExtractors, SoundCloudExtractor } from '@discord-player/extractor';
import SimplePlayDLExtractor from './extractors/SimplePlayDLExtractor';
import { Command } from './types';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// MAGIC FIX: Force discord-player to use play-dl
process.env.DP_FORCE_YTDL_MOD = "play-dl";

// Extended Client to hold commands
export class ExtendedClient extends Client {
    commands: Collection<string, Command> = new Collection();
    player: Player;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.player = new Player(this);

        this.player.events.on('error', (queue, error) => {
            console.log(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
        });

        this.player.events.on('playerError', (queue, error) => {
            console.log(`[${queue.guild.name}] Player Error: ${error.message}`);
        });

        this.player.events.on('playerStart', (queue, track) => {
            const channel = queue.metadata as any;
            channel?.send(`🎶 Now playing: **${track.title}**`);
        });

        this.player.events.on('emptyQueue', (queue) => {
            const channel = queue.metadata as any;
            channel?.send('✅ **Queue finished!** There are no more songs to play.');
        });
    }
}

const client = new ExtendedClient();

// Async initialization
(async () => {
    await client.player.extractors.register(SimplePlayDLExtractor as any, {});
    const cleanExtractors = DefaultExtractors.filter(ext => ext !== SoundCloudExtractor);
    await client.player.extractors.loadMulti(cleanExtractors);
    
    console.log('Audio extractors loaded successfully.');

    // Load Commands
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }

    // Event Handling
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath).default;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));
    process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

    const token = process.env.DISCORD_TOKEN?.trim();
    if (!token) {
        console.error('❌ FATAL ERROR: DISCORD_TOKEN is missing in environment variables!');
        process.exit(1);
    }

    console.log(`Logging in with token (Length: ${token.length})...`);
    client.login(token);
})();