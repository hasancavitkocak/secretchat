const { Server } = require('socket.io');

let io;

// Matching queue
const matchingQueue = [];
const activeChats = new Map();
const userSockets = new Map();

export default function handler(req, res) {
  if (!io) {
    console.log('Setting up Socket.IO server...');
    
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
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

      // Diğer event'ler...
      socket.on('cancel_match', () => {
        const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
        if (queueIndex !== -1) {
          matchingQueue.splice(queueIndex, 1);
          console.log(`${username} cancelled match search`);
        }
      });

      socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        
        if (!activeChats.has(chatId)) {
          const otherSocket = Array.from(io.sockets.sockets.values()).find(s => 
            s.rooms.has(chatId) && s !== socket
          );
          
          if (otherSocket) {
            activeChats.set(chatId, [socket, otherSocket]);
            console.log(`${username} joined existing chat: ${chatId}`);
          }
        }
        
        console.log(`${username} joined chat: ${chatId}`);
      });

      socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        
        if (activeChats.has(chatId)) {
          const sockets = activeChats.get(chatId);
          const partnerSocket = sockets.find(s => s !== socket);
          if (partnerSocket) {
            partnerSocket.emit('partner_left');
            console.log(`${username} left chat, notified partner in ${chatId}`);
          }
          activeChats.delete(chatId);
        } else {
          socket.to(chatId).emit('partner_left');
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
            console.log(`Message sent from ${username} to partner in ${chatId}: ${content}`);
          } else {
            console.log(`No partner found in chat ${chatId}`);
          }
        } else {
          socket.to(chatId).emit('message', message);
          console.log(`Message sent via room from ${username} in ${chatId}: ${content}`);
        }
      });

      // Arkadaşlık event'leri
      socket.on('send_friend_request', (data) => {
        const { chatId, targetUserId, targetUsername } = data;
        
        if (activeChats.has(chatId)) {
          const sockets = activeChats.get(chatId);
          const partnerSocket = sockets.find(s => s !== socket);
          if (partnerSocket) {
            partnerSocket.emit('friend_request_received', {
              fromUserId: userId,
              fromUsername: username,
              chatId: chatId
            });
            console.log(`Friend request sent from ${username} to ${targetUsername}`);
          }
        }
      });

      socket.on('accept_friend_request', (data) => {
        const { fromUserId, fromUsername, chatId } = data;
        
        if (activeChats.has(chatId)) {
          const sockets = activeChats.get(chatId);
          const partnerSocket = sockets.find(s => s !== socket);
          if (partnerSocket) {
            partnerSocket.emit('friend_request_accepted', {
              byUserId: userId,
              byUsername: username
            });
            console.log(`Friend request accepted by ${username} from ${fromUsername}`);
          }
        }
      });

      socket.on('reject_friend_request', (data) => {
        const { fromUserId, fromUsername, chatId } = data;
        
        if (activeChats.has(chatId)) {
          const sockets = activeChats.get(chatId);
          const partnerSocket = sockets.find(s => s !== socket);
          if (partnerSocket) {
            partnerSocket.emit('friend_request_rejected', {
              byUserId: userId,
              byUsername: username
            });
            console.log(`Friend request rejected by ${username} from ${fromUsername}`);
          }
        }
      });

      socket.on('remove_friend', (data) => {
        const { friendId, friendUsername } = data;
        
        const friendSocket = userSockets.get(friendId);
        if (friendSocket) {
          friendSocket.emit('friend_removed', {
            byUserId: userId,
            byUsername: username
          });
          console.log(`${username} removed ${friendUsername} from friends`);
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

    res.socket.server.io = io;
  }

  res.end();
}

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