const config = {
  wsUrl: 'ws://localhost:8080',  // Always connect to local bridge app
  development: {
    wsUrl: 'ws://localhost:8080',
  },
  production: {
    wsUrl: 'ws://localhost:8080',  // Changed from Render server to local
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env]; 