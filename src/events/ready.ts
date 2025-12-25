import { Events, Client, REST, Routes, ActivityType } from 'discord.js';
import { ExtendedClient } from '../index';
import dotenv from 'dotenv';

dotenv.config();

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client: ExtendedClient) {
        console.log(`Ready! Logged in as ${client.user?.tag}`);

        // Set Activity
        client.user?.setActivity('High Quality Music', { type: ActivityType.Listening });

        // Register Commands
        const commands = client.commands.map(cmd => cmd.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // Use global commands for production, guild for dev (faster update)
            // For now, using Global.
            await rest.put(
                Routes.applicationCommands(client.user?.id!),
                { body: commands },
            );

            console.log(`Successfully reloaded application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    },
};
