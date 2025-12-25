import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('Replays the current song from the beginning'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            await queue.node.seek(0);
            await interaction.editReply('⏮️ **Replaying** the current track.');
        } catch (e) {
            console.error(e);
            await interaction.editReply('❌ Failed to replay track.');
        }
    }
};
