const config = {
  development: {
    wsUrl: 'ws://localhost:8080',
  },
  production: {
    wsUrl: 'wss://cosmoids.vercel.app/', // Replace with your actual production WebSocket URL
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env]; 