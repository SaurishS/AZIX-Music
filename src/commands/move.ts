import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, VoiceBasedChannel } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Moves the bot to a different voice channel')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The voice channel to move to')
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'I am not currently playing music!', ephemeral: true });
        }

        const targetChannel = interaction.options.getChannel('channel', true) as VoiceBasedChannel;

        if (queue.channel?.id === targetChannel.id) {
            return interaction.reply({ content: 'I am already in that voice channel!', ephemeral: true });
        }

        const permissions = targetChannel.permissionsFor(interaction.client.user!);
        if (!permissions?.has('Connect') || !permissions?.has('Speak')) {
            return interaction.reply({ content: 'I need **Connect** and **Speak** permissions to join that channel.', ephemeral: true });
        }

        try {
            await interaction.deferReply();
            
            // NATIVE DISCORD MOVE (Opcode 4 via API)
            // This is equivalent to an admin dragging the bot.
            // It preserves the session ID usually.
            await interaction.guild?.members.me?.voice.setChannel(targetChannel);

            // Wait a moment for the move to settle
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Ensure the queue knows about the new channel (Sync)
            // This might prevent the library from getting confused later
            if (queue.connection) {
                // @ts-ignore - Internal property update if possible, or just trust the library handles the event
                // queue.channel = targetChannel; 
            }

            await interaction.editReply(`🚚 **Moved** to ${targetChannel.toString()}.`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Failed to move to that channel. Please try again.');
        }
    }
};
