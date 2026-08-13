require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { createServer } = require('./app');

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';

const { server, io } = createServer();

const startServer = async () => {
  await connectDB();

  server.listen(PORT, HOST, () => {
    console.log(`Backend running on http://${HOST}:${PORT}`);
    console.log(`Socket.IO ready on ws://${HOST}:${PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    io.close();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
