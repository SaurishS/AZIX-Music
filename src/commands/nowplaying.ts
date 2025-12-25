import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Shows the currently playing song and progress bar'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!); 

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        const track = queue.currentTrack;
        const ts = queue.node.getTimestamp();
        const progressBar = queue.node.createProgressBar({
            queue: false,
            timecodes: true,
            length: 15,
            indicator: '🔘',
            leftChar: '▬',
            rightChar: '▬'
        });

        // Format duration if it looks like raw seconds (e.g., "222")
        let duration = track?.duration || '0:00';
        if (!duration.includes(':')) {
            const seconds = parseInt(duration);
            if (!isNaN(seconds)) {
                const min = Math.floor(seconds / 60);
                const sec = seconds % 60;
                duration = `${min}:${sec.toString().padStart(2, '0')}`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Now Playing 🎵')
            .setDescription(`**[${track?.title}](${track?.url})**\n\n${progressBar}`)
            .setThumbnail(track?.thumbnail || null)
            .addFields(
                { name: 'Duration', value: duration, inline: true },
                { name: 'Requested By', value: track?.requestedBy?.globalName || track?.requestedBy?.username || '🤖 Autoplay', inline: true },
                { name: 'Status', value: queue.node.isPaused() ? '⏸️ Paused' : '▶️ Playing', inline: true }
            )
            .setColor(0x0099FF)
            .setFooter({ text: `Volume: ${queue.node.volume}% | Loop: ${queue.repeatMode === 0 ? 'Off' : (queue.repeatMode === 1 ? 'Track' : 'Queue')}` });

        await interaction.reply({ embeds: [embed] });
    }
};
