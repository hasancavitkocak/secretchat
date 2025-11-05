const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Matching queue
const matchingQueue = [];
const activeChats = new Map();
const userSockets = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    const { userId, username, gender, isPremium } = socket.handshake.auth;
    
    // Kullanıcı socket'ini kaydet
    userSockets.set(userId, socket);
    socket.user = { userId, username, gender, isPremium };

    // Eşleşme arama
    socket.on('find_match', (filters) => {
      console.log(`${username} is looking for a match with filters:`, filters);
      
      // Premium kontrolü
      if (gender === 'male' && filters.gender === 'female' && !isPremium) {
        socket.emit('match_error', 'PREMIUM_REQUIRED');
        return;
      }

      // Mevcut kuyrukta uyumlu kullanıcı ara
      const matchIndex = matchingQueue.findIndex(queuedUser => 
        areCompatible(socket.user, filters, queuedUser.user, queuedUser.filters)
      );

      if (matchIndex !== -1) {
        // Eşleşme bulundu
        const match = matchingQueue.splice(matchIndex, 1)[0];
        const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Chat oluştur
        activeChats.set(chatId, [socket, match.socket]);
        
        // Her iki kullanıcıya da eşleşme bildir
        socket.emit('match_found', {
          chatId,
          user: {
            id: match.user.userId,
            username: match.user.username,
            gender: match.user.gender,
            interests: [],
            isPremium: match.user.isPremium
          }
        });
        
        match.socket.emit('match_found', {
          chatId,
          user: {
            id: socket.user.userId,
            username: socket.user.username,
            gender: socket.user.gender,
            interests: [],
            isPremium: socket.user.isPremium
          }
        });
        
        console.log(`Match found: ${username} <-> ${match.user.username}`);
      } else {
        // Kuyruğa ekle
        matchingQueue.push({
          socket,
          user: socket.user,
          filters,
          timestamp: Date.now()
        });
        
        console.log(`${username} added to queue. Queue size: ${matchingQueue.length}`);
        
        // 30 saniye timeout
        setTimeout(() => {
          const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
          if (queueIndex !== -1) {
            matchingQueue.splice(queueIndex, 1);
            socket.emit('match_timeout');
            console.log(`${username} match timeout`);
          }
        }, 30000);
      }
    });

    // Diğer event'ler
    socket.on('cancel_match', () => {
      const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
        console.log(`${username} cancelled match search`);
      }
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`${username} joined chat: ${chatId}`);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      
      if (activeChats.has(chatId)) {
        const sockets = activeChats.get(chatId);
        const partnerSocket = sockets.find(s => s !== socket);
        if (partnerSocket) {
          partnerSocket.emit('partner_left');
        }
        activeChats.delete(chatId);
      }
      
      console.log(`${username} left chat: ${chatId}`);
    });

    socket.on('send_message', (data) => {
      const { chatId, content } = data;
      
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        senderId: userId,
        content,
        timestamp: Date.now()
      };
      
      if (activeChats.has(chatId)) {
        const sockets = activeChats.get(chatId);
        const partnerSocket = sockets.find(s => s !== socket);
        if (partnerSocket) {
          partnerSocket.emit('message', message);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', username);
      
      const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
      }
      
      for (const [chatId, sockets] of activeChats.entries()) {
        const socketIndex = sockets.indexOf(socket);
        if (socketIndex !== -1) {
          const partnerSocket = sockets[1 - socketIndex];
          if (partnerSocket) {
            partnerSocket.emit('partner_left');
          }
          activeChats.delete(chatId);
          break;
        }
      }
      
      userSockets.delete(userId);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
  });
});

// Uyumluluk kontrolü
function areCompatible(user1, filters1, user2, filters2) {
  if (user1.userId === user2.userId) return false;

  if (user1.gender === 'male' && filters1.gender === 'female' && !user1.isPremium) {
    return false;
  }
  if (user2.gender === 'male' && filters2.gender === 'female' && !user2.isPremium) {
    return false;
  }

  if (filters1.gender && filters1.gender !== user2.gender) return false;
  if (filters2.gender && filters2.gender !== user1.gender) return false;

  return true;
}