import { Events, VoiceState, TextChannel } from 'discord.js';
import { ExtendedClient } from '../index';
import { useQueue } from 'discord-player';

const disconnectTimers = new Map<string, NodeJS.Timeout>();

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState: VoiceState, newState: VoiceState) {
        const client = newState.client as ExtendedClient;
        const guildId = newState.guild.id;
        const queue = useQueue(guildId);

        // 1. Handle Bot Server Mute/Unmute
        if (newState.member?.id === client.user?.id && queue) {
            // DETECT MOVE: If both old and new channels exist, it's a move.
            if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                console.log('[VoiceState] Bot moved channels. Ignoring empty check.');
                return;
            }

            const textChannel = queue.metadata as TextChannel;
            
            if (!oldState.serverMute && newState.serverMute) {
                queue.node.pause();
                if (textChannel) await textChannel.send('⏸️ **Paused** because I was server muted.');
            } else if (oldState.serverMute && !newState.serverMute) {
                queue.node.resume();
                if (textChannel) await textChannel.send('▶️ **Resumed** playback.');
            }
        }

        // 2. Handle Empty Channel (15 min timeout)
        // We look at the channel the bot is currently in (if any)
        const botMember = newState.guild.members.cache.get(client.user?.id!);
        const botChannel = botMember?.voice.channel;

        if (botChannel) {
            // Check if channel is empty (excluding bot)
            // Race condition fix: Wait 5 seconds to allow member cache to update after a move
            setTimeout(async () => {
                // Re-fetch the channel to get latest member count
                const refreshedChannel = newState.guild.channels.cache.get(botChannel.id);
                if (!refreshedChannel || !refreshedChannel.isVoiceBased()) return;

                console.log(`[VoiceState] Checking channel: ${refreshedChannel.name} (${refreshedChannel.id})`);
                console.log(`[VoiceState] Member count: ${refreshedChannel.members.size}`);
                // refreshedChannel.members is a Collection. Let's see who is there.
                refreshedChannel.members.forEach(m => console.log(` - ${m.user.tag}`));

                if (refreshedChannel.members.size === 1) {
                    console.log('[VoiceState] Bot is alone. Triggering pause/timer.');
                    // IMMEDIATE PAUSE when alone
                    if (queue && queue.isPlaying()) {
                        queue.node.pause();
                        const textChannel = queue.metadata as TextChannel;
                        if (textChannel) await textChannel.send('⏸️ **Paused** because I am alone in the voice channel.');
                    }

                    if (!disconnectTimers.has(guildId)) {
                        // Start 10 minute timer
                        const timer = setTimeout(async () => {
                            if (queue) {
                                const currentTrack = queue.currentTrack;
                                const textChannel = queue.metadata as TextChannel;
                                
                                // Send Resume Link
                                if (currentTrack && textChannel) {
                                    await textChannel.send({
                                        content: `**Session ended due to inactivity.**\nI left the voice channel because I was alone for 10 minutes.\n\nTo resume playing **${currentTrack.title}**, use:\n\`\/play query:${currentTrack.url}\``
                                    });
                                }
                                
                                // Disconnect and clean up
                                queue.delete(); 
                            }
                            disconnectTimers.delete(guildId);
                        }, 10 * 60 * 1000); // 10 Minutes

                        disconnectTimers.set(guildId, timer);
                    }
                } else {
                    console.log('[VoiceState] Channel not empty. Cancelling timers.');
                    // Someone is in the channel (size > 1)
                    if (queue && queue.node.isPaused()) {
                        queue.node.resume();
                        const textChannel = queue.metadata as TextChannel;
                    }

                    if (disconnectTimers.has(guildId)) {
                        clearTimeout(disconnectTimers.get(guildId));
                        disconnectTimers.delete(guildId);
                    }
                }
            }, 5000); // 5 Second Delay
        } else {
            // Bot is not in a channel anymore
            if (disconnectTimers.has(guildId)) {
                clearTimeout(disconnectTimers.get(guildId));
                disconnectTimers.delete(guildId);
            }
        }
    },
};
