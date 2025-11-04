const { Server } = require('socket.io');
const cors = require('cors');

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Matching queue
const matchingQueue = [];
const activeChats = new Map(); // chatId -> [socket1, socket2]
const userSockets = new Map(); // userId -> socket

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
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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

  // Eşleşme aramasını iptal et
  socket.on('cancel_match', () => {
    const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
    if (queueIndex !== -1) {
      matchingQueue.splice(queueIndex, 1);
      console.log(`${username} cancelled match search`);
    }
  });

  // Chat'e katıl
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    
    // Eğer activeChats'te yoksa, mevcut chat'e ekle
    if (!activeChats.has(chatId)) {
      // Aynı chat'teki diğer kullanıcıyı bul
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

  // Chat'ten ayrıl
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    
    // Aktif chat'teki partner'a bildir
    if (activeChats.has(chatId)) {
      const sockets = activeChats.get(chatId);
      const partnerSocket = sockets.find(s => s !== socket);
      if (partnerSocket) {
        partnerSocket.emit('partner_left');
        console.log(`${username} left chat, notified partner in ${chatId}`);
      }
      activeChats.delete(chatId);
    } else {
      // Fallback: room-based notification
      socket.to(chatId).emit('partner_left');
    }
    
    console.log(`${username} left chat: ${chatId}`);
  });

  // Mesaj gönder
  socket.on('send_message', (data) => {
    const { chatId, content } = data;
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: userId,
      content,
      timestamp: Date.now()
    };
    
    // Aktif chat'teki partner'a mesajı gönder
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
      // Fallback: room-based messaging
      socket.to(chatId).emit('message', message);
      console.log(`Message sent via room from ${username} in ${chatId}: ${content}`);
    }
  });

  // Arkadaşlık isteği gönder
  socket.on('send_friend_request', (data) => {
    const { chatId, targetUserId, targetUsername } = data;
    
    // Partner'ı bul ve arkadaşlık isteği gönder
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

  // Arkadaşlık isteğini kabul et
  socket.on('accept_friend_request', (data) => {
    const { fromUserId, fromUsername, chatId } = data;
    
    // İsteği gönderen kişiye kabul bilgisi gönder
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

  // Arkadaşlık isteğini reddet
  socket.on('reject_friend_request', (data) => {
    const { fromUserId, fromUsername, chatId } = data;
    
    // İsteği gönderen kişiye red bilgisi gönder
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

  // Arkadaşlığı sil
  socket.on('remove_friend', (data) => {
    const { friendId, friendUsername } = data;
    
    // Arkadaşa bildir (eğer online ise)
    const friendSocket = userSockets.get(friendId);
    if (friendSocket) {
      friendSocket.emit('friend_removed', {
        byUserId: userId,
        byUsername: username
      });
      console.log(`${username} removed ${friendUsername} from friends`);
    }
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', () => {
    console.log('User disconnected:', username);
    
    // Kuyruktan çıkar
    const queueIndex = matchingQueue.findIndex(item => item.socket === socket);
    if (queueIndex !== -1) {
      matchingQueue.splice(queueIndex, 1);
    }
    
    // Aktif chat'lerden çıkar ve partnere bildir
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
    
    // User socket'ini temizle
    userSockets.delete(userId);
  });
});

// Basit uyumluluk kontrolü
function areCompatible(user1, filters1, user2, filters2) {
  // Aynı kullanıcı olamaz
  if (user1.userId === user2.userId) return false;

  // Premium kontrolü - sadece erkek kullanıcı kadın arıyorsa
  if (user1.gender === 'male' && filters1.gender === 'female' && !user1.isPremium) {
    return false;
  }
  if (user2.gender === 'male' && filters2.gender === 'female' && !user2.isPremium) {
    return false;
  }

  // Basit cinsiyet kontrolü
  // Eğer user1 belirli bir cinsiyet arıyorsa, user2 o cinsiyette olmalı
  if (filters1.gender && filters1.gender !== user2.gender) return false;
  if (filters2.gender && filters2.gender !== user1.gender) return false;

  // Diğer tüm durumlar uyumlu
  return true;
}

// Periyodik temizlik
setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  for (let i = matchingQueue.length - 1; i >= 0; i--) {
    if (matchingQueue[i].timestamp < fiveMinutesAgo) {
      matchingQueue[i].socket.emit('match_timeout');
      matchingQueue.splice(i, 1);
    }
  }
}, 60000);

console.log('WebSocket server running on port 3001');
console.log('Waiting for connections...');