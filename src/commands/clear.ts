import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears all songs from the queue'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || queue.tracks.size === 0) {
            return interaction.reply({ content: 'The queue is already empty!', ephemeral: true });
        }

        queue.tracks.clear();
        await interaction.reply('🗑️ **Cleared** the queue.');
    }
};
