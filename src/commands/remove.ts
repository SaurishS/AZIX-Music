import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes a specific song from the queue by its number')
        .addIntegerOption(option => 
            option.setName('number')
                .setDescription('The number of the song in the queue (see /queue)')
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || queue.tracks.size === 0) {
            return interaction.reply({ content: 'There are no songs in the queue to remove!', ephemeral: true });
        }

        const index = interaction.options.getInteger('number', true) - 1; // Convert to 0-based
        const tracks = queue.tracks.toArray();

        if (index >= tracks.length) {
            return interaction.reply({ content: `That song doesn't exist! There are only **${tracks.length}** songs in the queue.`, ephemeral: true });
        }

        const removedTrack = tracks[index];
        queue.node.remove(removedTrack);

        await interaction.reply(`❌ Removed **${removedTrack.title}** from the queue.`);
    }
};
