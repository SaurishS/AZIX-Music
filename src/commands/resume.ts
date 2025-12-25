import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the paused music'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        if (queue.node.isPlaying()) {
             return interaction.reply({ content: 'The music is already playing!', ephemeral: true });
        }

        queue.node.resume();
        await interaction.reply('▶️ **Resumed** playback.');
    }
};
