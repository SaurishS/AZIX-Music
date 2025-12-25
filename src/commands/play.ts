import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, GuildMember } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import play from 'play-dl';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or playlist from YouTube, Spotify, etc.')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song name or URL')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction: AutocompleteInteraction) {
        const query = interaction.options.getString('query', true);
        
        if (!query) return;

        try {
            // Use play-dl to search YouTube explicitly
            const results = await play.search(query, { 
                limit: 5, 
                source: { youtube: 'video' } 
            });

            // Return top 5 results
            return interaction.respond(
                results.map(t => ({
                    name: `${t.title} (${t.durationRaw})`.substring(0, 100),
                    value: t.url
                }))
            );
        } catch (e) {
            // fail silently on autocomplete errors
            return interaction.respond([]);
        }
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const player = useMainPlayer();
        if (!player) return interaction.reply({ content: 'Player not initialized!', ephemeral: true });

        const member = interaction.member as GuildMember;
        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        // The query will now be a URL if they selected from autocomplete, 
        // or a raw string if they just typed and hit enter.
        const query = interaction.options.get('query')?.value as string;

        await interaction.deferReply();

        try {
            const { track, searchResult } = await player.play(member.voice.channel, query, {
                searchEngine: QueryType.AUTO,
                requestedBy: interaction.user, // Save who requested the song
                nodeOptions: {
                    metadata: interaction.channel, // Store text channel for sending updates
                    volume: 80,
                    leaveOnEmpty: false, // We keep our custom 15-min logic for this
                    leaveOnEmptyCooldown: 0,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 15000, // Wait 15 seconds before leaving finished queue
                }
            });

            if (searchResult.hasPlaylist()) {
                await interaction.editReply(`✅ Added playlist **${searchResult.playlist?.title}** with **${searchResult.tracks.length}** songs!`);
            } else {
                await interaction.editReply(`✅ Added to queue: **${track.title}**`);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply(`Could not find or play **${query}**.`);
        }
    }
};
