import { BaseExtractor, Track, ExtractorInfo, ExtractorSearchContext, ExtractorStreamable, Playlist } from 'discord-player';
import play from 'play-dl';
import youtubedl from 'youtube-dl-exec';

export default class SimplePlayDLExtractor extends BaseExtractor {
    static identifier = 'com.azix.playdlextractor' as const;

    async validate(query: string) {
        // Check if it's a valid YouTube video OR playlist URL
        const type = play.yt_validate(query);
        return type === 'video' || type === 'playlist';
    }

    async handle(query: string, context: ExtractorSearchContext): Promise<ExtractorInfo> {
        try {
            const type = play.yt_validate(query);

            if (type === 'playlist') {
                const playlistInfo = await play.playlist_info(query, { incomplete: true });
                const videos = await playlistInfo.all_videos();
                
                const tracks = videos.map(video => {
                    return new Track(this.context.player, {
                        title: video.title!,
                        url: video.url,
                        duration: video.durationInSec.toString(),
                        thumbnail: video.thumbnails[0]?.url || '',
                        author: video.channel?.name || 'Unknown',
                        views: video.views,
                        source: 'youtube',
                        queryType: 'youtubeVideo'
                    });
                });

                const playlist = new Playlist(this.context.player, {
                    title: playlistInfo.title || 'YouTube Playlist',
                    description: '',
                    thumbnail: playlistInfo.thumbnail?.url || '',
                    author: { name: playlistInfo.channel?.name || 'Unknown', url: playlistInfo.channel?.url || '' },
                    type: 'playlist',
                    source: 'youtube',
                    tracks: tracks,
                    url: playlistInfo.url!,
                    id: playlistInfo.id || ''
                });

                return { playlist, tracks };
            }

            const info = await play.video_info(query);
            const track = new Track(this.context.player, {
                title: info.video_details.title!,
                url: info.video_details.url,
                duration: info.video_details.durationInSec.toString(),
                thumbnail: info.video_details.thumbnails[0]?.url || '',
                author: info.video_details.channel?.name || 'Unknown',
                views: info.video_details.views,
                source: 'youtube',
                queryType: 'youtubeVideo'
            });

            return { playlist: null, tracks: [track] };
        } catch (e) {
            console.error('[SimplePlayDLExtractor] Error handling query:', e);
            return { playlist: null, tracks: [] };
        }
    }

    async stream(info: Track): Promise<ExtractorStreamable> {
        try {
            console.log(`[SimplePlayDLExtractor] Using yt-dlp for: ${info.url}`);
            
            // fetch the raw audio url using yt-dlp
            // We use specific flags to ensure we get the direct audio stream, bypassing ads.
            const output = await youtubedl(info.url, {
                getUrl: true,
                format: 'bestaudio',
                noWarnings: true,
                audioQuality: 0,
                noPlaylist: true, // Ensure we don't get a playlist mix
                noCheckCertificates: true, // Avoid SSL hurdles that might redirect
            });

            const rawUrl = (output as unknown as string).trim(); 
            console.log('[SimplePlayDLExtractor] yt-dlp URL fetched successfully.');
            
            return rawUrl;
        } catch (e) {
            console.error('[SimplePlayDLExtractor] yt-dlp failed:', e);
            throw e;
        }
    }

    async bridge(track: Track, _sourceExtractor: BaseExtractor | null): Promise<ExtractorStreamable | null> {
        try {
            const query = `${track.title} ${track.author} official audio`;
            console.log(`[Spotify Bridge] Searching YouTube for: ${query}`);
            
            let videoUrl = '';

            // STRATEGY 1: YouTube API (Reliable)
            if (process.env.YOUTUBE_API_KEY) {
                try {
                    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${process.env.YOUTUBE_API_KEY}&maxResults=1`;
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    if (data.items && data.items.length > 0) {
                        videoUrl = `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
                        console.log(`[Spotify Bridge] API Match: ${videoUrl}`);
                    }
                } catch (e) {
                    console.error('[Spotify Bridge] API Error:', e);
                }
            }

            // STRATEGY 2: play-dl Fallback
            if (!videoUrl) {
                const results = await play.search(query, { 
                    limit: 1, 
                    source: { youtube: 'video' } 
                });
                if (results && results.length > 0) {
                    videoUrl = results[0].url;
                }
            }

            if (!videoUrl) return null;

            // We fetch the stream right now to satisfy the ExtractorStreamable requirement
            const output = await youtubedl(videoUrl, {
                getUrl: true,
                format: 'bestaudio',
                noWarnings: true,
                audioQuality: 0, 
                noPlaylist: true,
                noCheckCertificates: true,
            });

            return (output as unknown as string).trim();
        } catch (e) {
            console.error('[Spotify Bridge] Bridging failed:', e);
            return null;
        }
    }

    async getRelatedTracks(track: Track): Promise<ExtractorInfo> {
        try {
            // Use play-dl to find related videos from YouTube
            // If the track is from Spotify, the bridge url or raw url might be a YouTube link.
            // If not, we search for the track on YouTube first.
            
            let youtubeUrl = track.url;
            
            if (track.source === 'spotify') {
                // We need to search for it first to get a YouTube ID to find related videos
                const query = `${track.title} ${track.author} official audio`;
                const search = await play.search(query, { limit: 1, source: { youtube: 'video' } });
                if (search[0]) youtubeUrl = search[0].url;
            }

            if (play.yt_validate(youtubeUrl) === 'video') {
                const info = await play.video_info(youtubeUrl);
                // related_videos are strings (URLs)
                const relatedUrls = info.related_videos.slice(0, 5);

                // Fetch basic info for each related URL in parallel
                const relatedInfos = await Promise.all(
                    relatedUrls.map(async (url) => {
                        try {
                            return await play.video_basic_info(url);
                        } catch {
                            return null;
                        }
                    })
                );

                // Filter out failed fetches and map to Tracks
                const tracks = relatedInfos
                    .filter((vid): vid is Awaited<ReturnType<typeof play.video_basic_info>> => vid !== null)
                    .map(vid => new Track(this.context.player, {
                        title: vid.video_details.title!,
                        url: vid.video_details.url,
                        duration: vid.video_details.durationInSec.toString(),
                        thumbnail: vid.video_details.thumbnails[0]?.url || '',
                        author: vid.video_details.channel?.name || 'Unknown',
                        views: vid.video_details.views,
                        source: 'youtube',
                        queryType: 'youtubeVideo'
                    }));

                return { playlist: null, tracks };
            }

            return { playlist: null, tracks: [] };
        } catch (e) {
            console.error('[SimplePlayDLExtractor] Failed to get related tracks:', e);
            return { playlist: null, tracks: [] };
        }
    }
}
