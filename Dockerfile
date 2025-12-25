# Build Stage
FROM node:18-slim AS builder

WORKDIR /usr/src/app

# Install dependencies including ffmpeg dependencies if needed (though ffmpeg-static handles binary)
# Python and build tools are sometimes needed for node-gyp (sodium-native etc)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build # We need to add this script to package.json

# Production Stage
FROM node:18-slim

WORKDIR /usr/src/app

# Install ffmpeg and python3 (required for yt-dlp/play-dl wrappers)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist

CMD ["node", "dist/index.js"]
