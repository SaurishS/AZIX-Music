# 🎵 Azix - High-Fidelity Discord Music Bot

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

**The ultimate ad-free music experience for your Discord server.**  
Stable. Fast. Feature-Rich.

[Report Bug](https://github.com/SaurishS/AZIX-Music/issues) · [Request Feature](https://github.com/SaurishS/AZIX-Music/issues)

</div>

---

## ✨ Features

- **🚫 Zero Ads:** Built-in advanced ad-blocking logic using `yt-dlp` and `play-dl`.
- **🎧 Multi-Source Support:**
  - **YouTube:** Videos, Playlists, Mixes.
  - **Spotify:** Tracks, Albums, Large Playlists (200+ songs).
  - **SoundCloud:** Full support.
- **📜 Instant Lyrics:** Fetch lyrics for the current song or any query via Genius.
- **⚡ Smart Queue:** Drag-and-drop simulation (`/move`), pagination, and shuffle/loop modes.
- **🎹 24/7 Stability:** Auto-reconnection logic and efficient resource management.

---

## 🤖 Commands

| Command | Description |
| :--- | :--- |
| **/play** `query` | Plays a song/playlist from YouTube or Spotify. |
| **/pause** | Pauses the current track. |
| **/resume** | Resumes playback. |
| **/skip** | Skips to the next song in the queue. |
| **/stop** | Clears the queue and leaves the channel. |
| **/queue** | Displays the current music queue (Paginated). |
| **/lyrics** | Fetches lyrics for the current or specific song. |
| **/nowplaying** | Shows progress bar and requester info. |
| **/loop** | Toggles Loop Mode (Track / Queue / Off). |
| **/shuffle** | Shuffles the current queue. |
| **/move** `channel` | Moves the bot to another voice channel without stopping music. |
| **/skipto** `number` | Skips directly to a specific track number. |
| **/remove** `number` | Removes a specific track from the queue. |
| **/clear** | Clears the entire queue. |

---

## 🚀 Deployment

### Option 1: One-Click Deploy (Railway)

The easiest way to host Azix 24/7.

1. Fork this repository.
2. Sign up on [Railway](https://railway.app).
3. Create a **New Project** → **Deploy from GitHub**.
4. Add the following **Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `DISCORD_TOKEN` | Your Bot Token from the Discord Developer Portal. |
| `SPOTIFY_CLIENT_ID` | Your Spotify App Client ID. |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify App Client Secret. |
| `YOUTUBE_API_KEY` | (Optional) For higher search accuracy. |
| `DP_FORCE_YTDL_MOD` | Set strictly to `play-dl`. |

### Option 2: Self-Hosting (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/SaurishS/AZIX-Music.git
cd AZIX-Music

# 2. Build the image
docker build -t azix-music .

# 3. Run container (Pass env vars)
docker run -d --env-file .env azix-music
```

### Option 3: Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the bot
npm start
```

---

## 📄 Legal

- [Terms of Service](TERMS.md)
- [Privacy Policy](PRIVACY.md)

---

<div align="center">
Made with ❤️ by Saurish
</div>
