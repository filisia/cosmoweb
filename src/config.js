const config = {
  development: {
    wsUrl: 'ws://localhost:8080',
  },
  production: {
    wsUrl: 'wss://cosmoids.vercel.app/',
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env]; 