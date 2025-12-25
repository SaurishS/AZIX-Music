# Azix - Feature-Rich Discord Music Bot

## Project Status
- **Current Phase:** Advanced Feature Implementation (Complete).
- **Next Phase:** Final Polish & 24/7 Deployment.
- **Date Saved:** December 23, 2025.

## Technical Architecture
- **Language:** TypeScript (Node.js 18+)
- **Framework:** `discord.js` v14
- **Music Engine:** `discord-player` v6
- **Primary Streamer:** `youtube-dl-exec` (Wrapper for system `yt-dlp` binary).
    - **Config:** `format: 'bestaudio'`, `audioQuality: 0`, `skipFFmpeg: false` (in `index.ts`).
    - **Why:** Bypasses YouTube bot detection reliably where JS libraries fail.
- **Extractors:**
    - `SimplePlayDLExtractor` (Custom): Handles YouTube links & searches using `yt-dlp` for streaming. Also handles Spotify Bridging via YouTube Data API v3 (Search) -> yt-dlp (Stream).
    - `DefaultExtractors`: For Spotify metadata parsing.
- **Lyrics:** `genius-lyrics` (Custom cleaner for better matches).

## Commands Implemented
- **Playback:**
    - `/play <query>`: Smart search + Spotify support.
    - `/pause` / `/resume`
    - `/stop`: Clear & Leave.
    - `/skip`: Next song.
    - `/skipto <number>`: Jump to specific track (removes previous).
    - `/replay`: Seek to 0:00 of current track.
    - `/pineapple`: **Secret Command** (Plays "Ik Vaari Aa" + "I Love You Cookie! ❤️").
- **Queue Management:**
    - `/queue`: Paginated with Buttons (Prev/Next).
    - `/clear`: Wipe queue.
    - `/remove <number>`: Delete specific song.
    - `/shuffle`: Toggle Shuffle/Unshuffle (restores original order).
    - `/loop`: Interactive Menu (Track/Queue/Cancel).
- **Utility:**
    - `/move <channel>`: "Drag Simulation" move (using `joinVoiceChannel` + Resume hack) to keep music playing while switching VCs.
    - `/nowplaying`: Shows Progress Bar, Duration, Requester Name.
    - `/lyrics`: Fetches song lyrics (Auto or Manual query).

## Critical Logic & Event Handlers
- **Smart Autoplay (Removed):** Reverted to a clean state without `/autoplay` command to ensure stability.
- **Queue Finished:** Sends "✅ **Queue finished!**" message.
- **Auto-Disconnect:**
    - **Queue End:** Waits 15 seconds, then leaves.
    - **Empty Channel:** Pauses instantly. Waits 10 minutes, then leaves (sends Resume Link).
- **Move Logic:** Uses `joinVoiceChannel` (native Opcode 4) + `setTimeout` resume to handle channel switches without destroying the queue.
- **Spotify Bridge:** Uses `YOUTUBE_API_KEY` (if in env) for highly accurate "Official Audio" matching, fallback to `play-dl` scraping.

## Pending Tasks (Next Session)
1.  **GF Request #1:** (Unknown - To be implemented).
2.  **GF Request #2:** (Unknown - To be implemented).
3.  **Deployment:** Push code to GitHub -> Deploy on Railway.app (Dockerfile ready).

## Environment Variables (.env)
- `DISCORD_TOKEN`: Bot Token.
- `SPOTIFY_CLIENT_ID` & `SECRET`: Metadata.
- `YOUTUBE_API_KEY`: Search accuracy for bridge.
