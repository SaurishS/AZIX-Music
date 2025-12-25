import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { useQueue, Track } from 'discord-player';

// In-memory storage for original queue orders (GuildID -> Track[])
// Note: If the bot restarts, this memory is lost, which is expected behavior.
const originalOrders = new Map<string, Track[]>();

export default {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Toggles shuffle mode (Shuffle / Unshuffle)'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no queue to shuffle!', ephemeral: true });
        }

        const guildId = interaction.guildId!;

        // Check if we have a saved "Original Order" -> implied "Currently Shuffled"
        if (originalOrders.has(guildId)) {
            // UNSHUFFLE LOGIC
            const originalTracks = originalOrders.get(guildId)!;
            
            // Clear current shuffled tracks
            queue.tracks.clear();
            
            // Add back original tracks
            // We use a loop or add logic. queue.tracks.add accepts array.
            queue.tracks.add(originalTracks);
            
            // Clear the memory
            originalOrders.delete(guildId);
            
            return interaction.reply('🔁 **Unshuffled** the queue. Back to original order.');
        } else {
            // SHUFFLE LOGIC
            // 1. Save current order
            originalOrders.set(guildId, queue.tracks.toArray());
            
            // 2. Shuffle
            queue.tracks.shuffle();
            
            return interaction.reply('🔀 **Shuffled** the queue.');
        }
    }
};
