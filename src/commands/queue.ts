import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the music queue with pagination'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!); 

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no queue right now!', ephemeral: true });
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();
        let currentPage = 0;

        // "Smart" Pagination: 
        // YouTube titles tend to be long and messy, so we limit to 5 to avoid the 1024 char limit.
        // Spotify/other sources are usually cleaner, so we can risk 10.
        // We check the source of the first track in the queue or the current track.
        const isYoutube = (currentTrack?.source === 'youtube') || (tracks[0]?.source === 'youtube');
        const itemsPerPage = isYoutube ? 5 : 10;

        const totalPages = Math.ceil(tracks.length / itemsPerPage) || 1;

        // Helper to generate the embed for a specific page
        const generateEmbed = (page: number) => {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Server Queue (${isYoutube ? 'YouTube' : 'Standard'} View)`)
                .setThumbnail(currentTrack?.thumbnail || null)
                .setDescription(`**Now Playing:**\n[${currentTrack?.title}](${currentTrack?.url}) (${currentTrack?.duration})\n\n**Up Next:**`)
                .setFooter({ text: `Total songs in queue: ${tracks.length}` });

            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentTracks = tracks.slice(start, end);

            if (currentTracks.length > 0) {
                const trackList = currentTracks.map((track, i) => {
                    let title = track.title;
                    // Truncate logic to be safe
                    const maxLen = isYoutube ? 60 : 50; // Stricter truncation for 10-item pages
                    if (title.length > maxLen) {
                        title = title.substring(0, maxLen - 3) + '...';
                    }
                    return `**${start + i + 1}.** [${title}](${track.url}) (${track.duration})`;
                }).join('\n');
                embed.addFields({ name: `Page ${page + 1}/${totalPages}`, value: trackList });
            } else {
                embed.addFields({ name: 'Upcoming', value: 'No more songs in queue.' });
            }

            return embed;
        };

        // Helper to generate buttons based on current page
        const generateButtons = (page: number) => {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page >= totalPages - 1)
                );
            return row;
        };

        const initialEmbed = generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);

        const response = await interaction.reply({
            embeds: [initialEmbed],
            components: totalPages > 1 ? [initialButtons] : [],
            fetchReply: true
        });

        if (totalPages <= 1) return;

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // Buttons active for 60 seconds
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'Use the command yourself to change pages!', ephemeral: true });
                return;
            }

            if (i.customId === 'prev_page') {
                currentPage--;
            } else if (i.customId === 'next_page') {
                currentPage++;
            }

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons(currentPage)]
            });
        });

        collector.on('end', async () => {
            // Remove buttons when timed out
            try {
                await interaction.editReply({ components: [] });
            } catch (e) {
                // Message might be deleted
            }
        });
    }
};