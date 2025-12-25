import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { useQueue, QueueRepeatMode } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle looping for the track or queue'),
    async execute(interaction: ChatInputCommandInteraction) {
        const queue = useQueue(interaction.guildId!);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        // Logic: If already looping, turn it off.
        if (queue.repeatMode !== QueueRepeatMode.OFF) {
            queue.setRepeatMode(QueueRepeatMode.OFF);
            return interaction.reply('🔂 **Looping Disabled**');
        }

        // Logic: If NOT looping, ask user.
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('loop_track')
                    .setLabel('Loop Track')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔂'),
                new ButtonBuilder()
                    .setCustomId('loop_queue')
                    .setLabel('Loop Queue')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔁'),
                new ButtonBuilder()
                    .setCustomId('cancel_loop')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        const response = await interaction.reply({
            content: 'Select a loop mode:',
            components: [row],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 15000 
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'This menu is not for you!', ephemeral: true });
                return;
            }

            if (i.customId === 'loop_track') {
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                await i.update({ content: '🔂 **Looping Track** enabled', components: [] });
            } else if (i.customId === 'loop_queue') {
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                await i.update({ content: '🔁 **Looping Queue** enabled', components: [] });
            } else if (i.customId === 'cancel_loop') {
                await i.update({ content: 'Cancelled selection.', components: [] });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await interaction.editReply({ content: 'Loop selection timed out.', components: [] });
            }
        });
    }
};
