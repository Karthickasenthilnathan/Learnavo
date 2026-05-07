/**
 * WebSocket — Live Session Broadcasting
 * Handles real-time communication between server and professor dashboards.
 */

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join a session room for live updates
    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log(`[WS] ${socket.id} joined session:${sessionId}`);
      socket.emit('session:joined', { sessionId, message: 'Connected to live session' });
    });

    // Leave a session room
    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      console.log(`[WS] ${socket.id} left session:${sessionId}`);
    });

    // Join global dashboard live feed (receives all attendance events)
    socket.on('dashboard:live:join', () => {
      socket.join('dashboard:live');
      console.log(`[WS] ${socket.id} joined dashboard:live`);
      socket.emit('dashboard:live:joined', { message: 'Connected to live attendance feed' });
    });

    // Leave global dashboard live feed
    socket.on('dashboard:live:leave', () => {
      socket.leave('dashboard:live');
      console.log(`[WS] ${socket.id} left dashboard:live`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id} (${reason})`);
    });

    // Ping/pong for keepalive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  console.log('[WS] WebSocket server initialized');
}
