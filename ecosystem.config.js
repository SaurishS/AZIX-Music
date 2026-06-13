module.exports = {
  apps: [{
    name: "azix-music",
    script: "dist/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      // These will be loaded from the .env file on the server, 
      // or they can be hardcoded here (not recommended for secrets)
    }
  }]
};
