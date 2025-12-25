import { Events, Interaction } from 'discord.js';
import { ExtendedClient } from '../index';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        const client = interaction.client as ExtendedClient;

        // Handle Autocomplete
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction, client);
                }
            } catch (error) {
                console.error(error);
            }
            return;
        }

        // Handle Chat Command
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
                }
            } catch (e) {
                // Ignore errors during error reporting (e.g. Unknown Interaction)
            }
        }
    },
};
