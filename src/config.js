const config = {
  wsUrl: process.env.NODE_ENV === 'production' 
    ? 'ws://localhost:8080'  // Connect to local bridge app in production
    : 'ws://localhost:8080', // Connect to local bridge app in development
  development: {
    wsUrl: 'ws://localhost:8080',
  },
  production: {
    wsUrl: 'wss://cosmoweb-server.onrender.com',
  },
};


const env = process.env.NODE_ENV || 'development';
export default config[env]; 