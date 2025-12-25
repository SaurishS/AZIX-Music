import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current track'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        if (queue.node.isPaused()) {
            return interaction.reply({ content: 'The music is already paused! Use `/resume` to play.', ephemeral: true });
        }

        queue.node.pause();
        await interaction.reply('⏸️ **Paused** the music.');
    }
};
