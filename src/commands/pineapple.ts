import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('pineapple')
        .setDescription('A secret command for someone special'),
    async execute(interaction: ChatInputCommandInteraction) {
        const player = useMainPlayer();
        const member = interaction.member as GuildMember;

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to use this secret!', ephemeral: true });
        }

        const songUrl = 'https://youtu.be/vZO8Io6K00o';

        await interaction.deferReply();

        try {
            await player.play(member.voice.channel, songUrl, {
                searchEngine: QueryType.AUTO,
                requestedBy: interaction.user,
                nodeOptions: {
                    metadata: interaction.channel,
                    volume: 80,
                    leaveOnEmpty: false,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 15000,
                }
            });

            await interaction.editReply('I Love You Cookie! ❤️');
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Something went wrong with the secret command...');
        }
    }
};
