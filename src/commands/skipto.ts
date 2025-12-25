import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skips directly to a specific track in the queue')
        .addIntegerOption(option => 
            option.setName('track')
                .setDescription('The track number to skip to')
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        const trackNum = interaction.options.getInteger('track', true);
        const tracks = queue.tracks.toArray();

        if (trackNum > tracks.length) {
            return interaction.reply({ content: `Invalid track number. There are only ${tracks.length} songs in the queue.`, ephemeral: true });
        }

        // trackNum 1 = Index 0
        const targetTrack = tracks[trackNum - 1];

        // skipTo removes all previous songs and plays the target
        queue.node.skipTo(targetTrack);

        await interaction.reply(`⏩ **Skipped** to track **${trackNum}**: **${targetTrack.title}**`);
    }
};
