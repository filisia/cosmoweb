const config = {
  development: {
    wsUrl: 'ws://localhost:8080',
  },
  production: {
    wsUrl: 'wss://cosmoweb-b7ue2ovdn-alexandros-projects-5a23d014.vercel.app',
  },
};

const env = process.env.NODE_ENV || 'development';
export default config[env]; 