import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';
import { Client as GeniusClient } from 'genius-lyrics';

const genius = new GeniusClient(); // Uses scraping by default, no key needed usually

export default {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the current song or a specific search')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song to search for (Defaults to current track)')
                .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        let query = interaction.options.getString('query');
        const queue = useQueue(interaction.guildId!);

        if (!query) {
            if (!queue || !queue.isPlaying()) {
                return interaction.editReply({ content: '❌ No music is playing and no query was provided.' });
            }
            // Use current track
            const track = queue.currentTrack;
            
            // Clean Title Strategy:
            // 1. Remove (...) and [...] completely (e.g., (Official Video), [Lyrics])
            // 2. Remove "ft.", "feat"
            // 3. Remove non-alphanumeric trailing junk
            let cleanTitle = track?.title
                .replace(/[\(\[].*?[\)\]]/g, '') // Remove (text) and [text]
                .replace(/ft\.|feat\.|feat/gi, '') // Remove ft.
                .trim();

            // Clean Author Strategy:
            // Remove "VEVO", "Official", "Topic"
            let cleanAuthor = track?.author
                .replace(/VEVO|Official|Topic/gi, '')
                .trim();

            // Fallback: If author is "Unknown" or messy, just use title if it looks complete
            if (cleanAuthor === 'Unknown') cleanAuthor = '';

            query = `${cleanTitle} ${cleanAuthor}`.trim();
            console.log(`[Lyrics] Cleaned Search Query: "${query}"`);
        }

        try {
            // Search Genius
            const searches = await genius.songs.search(query);
            
            if (searches.length === 0) {
                return interaction.editReply({ content: `❌ No lyrics found for **${query}**.` });
            }

            // Pick the first result
            const song = searches[0];
            const lyrics = await song.lyrics();

            if (!lyrics) {
                return interaction.editReply({ content: `❌ Lyrics found for **${song.title}** but they are empty!` });
            }

            // Format & Send
            // Discord Embed limits description to 4096 chars.
            const trimmedLyrics = lyrics.length > 4000 ? lyrics.substring(0, 4000) + '...' : lyrics;

            const embed = new EmbedBuilder()
                .setTitle(song.title)
                .setURL(song.url)
                .setAuthor({ name: song.artist.name, iconURL: song.artist.image })
                .setThumbnail(song.image)
                .setDescription(trimmedLyrics)
                .setColor(0xFFFF00) // Genius Yellow
                .setFooter({ text: 'Lyrics provided by Genius' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ An error occurred while fetching lyrics.' });
        }
    }
};
