const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const configureSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (${socket.userId})`);

    // Join user to their personal room
    socket.join(socket.userId.toString());
    console.log(`📍 User ${socket.userId} joined room: ${socket.userId}`);

    /**
     * REAL-TIME EVENT LISTENERS
     */

    /**
     * User joins a quiz/test room
     */
    socket.on('quiz:join', (data) => {
      const { quizId, quizName } = data;
      const roomName = `quiz_${quizId}`;

      socket.join(roomName);
      console.log(`📝 User ${socket.userId} joined quiz: ${quizName}`);

      // Notify others that user started
      io.to(roomName).emit('quiz:userJoined', {
        userId: socket.userId,
        quizName,
        totalParticipants: io.sockets.adapter.rooms.get(roomName)?.size || 0,
        timestamp: new Date(),
      });
    });

    /**
     * User leaves quiz/test room
     */
    socket.on('quiz:leave', (data) => {
      const { quizId } = data;
      const roomName = `quiz_${quizId}`;

      socket.leave(roomName);
      console.log(`📝 User ${socket.userId} left quiz room`);

      io.to(roomName).emit('quiz:userLeft', {
        userId: socket.userId,
        totalParticipants: io.sockets.adapter.rooms.get(roomName)?.size || 0,
      });
    });

    /**
     * Real-time quiz progress update
     */
    socket.on('quiz:progress', (data) => {
      const { quizId, currentQuestion, answeredCount } = data;
      const roomName = `quiz_${quizId}`;

      io.to(roomName).emit('quiz:progressUpdate', {
        userId: socket.userId,
        currentQuestion,
        answeredCount,
        timestamp: new Date(),
      });
    });

    /**
     * Test/Interview live updates
     */
    socket.on('test:update', (data) => {
      const { testId, stage, progress } = data;
      const roomName = `test_${testId}`;

      socket.join(roomName);

      io.to(socket.userId.toString()).emit('test:stageUpdate', {
        stage,
        progress,
        timestamp: new Date(),
      });
    });

    /**
     * Interview room join
     */
    socket.on('interview:join', (data) => {
      const { interviewId, interviewTitle } = data;
      const roomName = `interview_${interviewId}`;

      socket.join(roomName);
      console.log(`🎤 User ${socket.userId} joined interview: ${interviewTitle}`);

      io.to(roomName).emit('interview:userJoined', {
        userId: socket.userId,
        interviewTitle,
        timestamp: new Date(),
      });
    });

    /**
     * Leaderboard updates
     */
    socket.on('leaderboard:subscribe', (data) => {
      const { testId } = data;
      const roomName = `leaderboard_${testId}`;

      socket.join(roomName);
      console.log(`🏆 User ${socket.userId} subscribed to leaderboard`);
    });

    /**
     * Activity feed updates
     */
    socket.on('activity:subscribe', (data) => {
      const { targetUserId } = data;
      const roomName = `activity_${targetUserId}`;

      socket.join(roomName);
      console.log(`📊 Subscribed to activity feed for user: ${targetUserId}`);
    });

    /**
     * Notification settings
     */
    socket.on('notifications:enable', (data) => {
      socket.join(`notifications_${socket.userId}`);
      console.log(`🔔 Notifications enabled for ${socket.userId}`);

      socket.emit('notifications:ready', {
        message: 'You will receive real-time notifications',
      });
    });

    socket.on('notifications:disable', () => {
      socket.leave(`notifications_${socket.userId}`);
      console.log(`🔇 Notifications disabled for ${socket.userId}`);
    });

    /**
     * Live chat/comments
     */
    socket.on('comment:post', (data) => {
      const { resourceId, resourceType, message } = data;
      const roomName = `comments_${resourceType}_${resourceId}`;

      io.to(roomName).emit('comment:new', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        message,
        timestamp: new Date(),
      });
    });

    /**
     * Status updates
     */
    socket.on('status:update', (data) => {
      const { status } = data;

      // Broadcast to specific user room
      io.to(socket.userId.toString()).emit('profile:statusUpdate', {
        status,
        timestamp: new Date(),
      });
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${socket.userId}:`, error);
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`👋 User disconnected: ${socket.id} (${socket.userId})`);

      // Broadcast user offline status
      io.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });
  });

  console.log('✅ Socket.IO configured successfully');
  return io;
};

// Get io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call configureSocket first.');
  }
  return io;
};

// Emit to user
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(userId.toString()).emit(event, data);
};

// Emit to room
const emitToRoom = (roomName, event, data) => {
  if (!io) return;
  io.to(roomName).emit(event, data);
};

// Broadcast to all
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  configureSocket,
  getIO,
  emitToUser,
  emitToRoom,
  broadcast,
};
