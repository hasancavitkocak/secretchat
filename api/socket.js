// Vercel için Socket.IO alternatifi - Server-Sent Events kullanacağız
const matchingQueue = [];
const activeChats = new Map();
const userConnections = new Map();

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Server-Sent Events connection
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const userId = req.query.userId;
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }
    
    // Store connection
    userConnections.set(userId, res);
    
    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    
    // Handle client disconnect
    req.on('close', () => {
      userConnections.delete(userId);
      // Remove from matching queue
      const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
      }
    });
    
    return;
  }

  if (req.method === 'POST') {
    const { action, userId, data } = req.body;
    
    switch (action) {
      case 'find_match':
        handleFindMatch(userId, data, res);
        break;
      case 'cancel_match':
        handleCancelMatch(userId, res);
        break;
      case 'send_message':
        handleSendMessage(userId, data, res);
        break;
      case 'leave_chat':
        handleLeaveChat(userId, data, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

function sendToUser(userId, data) {
  const connection = userConnections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending to user:', error);
      userConnections.delete(userId);
    }
  }
}

function handleFindMatch(userId, filters, res) {
  const user = filters.user;
  
  // Premium kontrolü
  if (user.gender === 'male' && filters.gender === 'female' && !user.isPremium) {
    res.json({ error: 'PREMIUM_REQUIRED' });
    return;
  }

  // Mevcut kuyrukta uyumlu kullanıcı ara
  const matchIndex = matchingQueue.findIndex(queuedUser => 
    areCompatible(user, filters, queuedUser.user, queuedUser.filters)
  );

  if (matchIndex !== -1) {
    // Eşleşme bulundu
    const match = matchingQueue.splice(matchIndex, 1)[0];
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Chat oluştur
    activeChats.set(chatId, [userId, match.userId]);
    
    // Her iki kullanıcıya da eşleşme bildir
    sendToUser(userId, {
      type: 'match_found',
      chatId,
      user: {
        id: match.user.userId,
        username: match.user.username,
        gender: match.user.gender,
        interests: [],
        isPremium: match.user.isPremium
      }
    });
    
    sendToUser(match.userId, {
      type: 'match_found',
      chatId,
      user: {
        id: user.userId,
        username: user.username,
        gender: user.gender,
        interests: [],
        isPremium: user.isPremium
      }
    });
    
    res.json({ success: true, chatId });
  } else {
    // Kuyruğa ekle
    matchingQueue.push({
      userId,
      user,
      filters,
      timestamp: Date.now()
    });
    
    res.json({ success: true, queued: true });
    
    // 30 saniye timeout
    setTimeout(() => {
      const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
        sendToUser(userId, { type: 'match_timeout' });
      }
    }, 30000);
  }
}

function handleCancelMatch(userId, res) {
  const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
  if (queueIndex !== -1) {
    matchingQueue.splice(queueIndex, 1);
  }
  res.json({ success: true });
}

function handleSendMessage(userId, data, res) {
  const { chatId, content } = data;
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    senderId: userId,
    content,
    timestamp: Date.now()
  };
  
  if (activeChats.has(chatId)) {
    const [user1, user2] = activeChats.get(chatId);
    const partnerId = user1 === userId ? user2 : user1;
    
    sendToUser(partnerId, {
      type: 'message',
      message
    });
  }
  
  res.json({ success: true });
}

function handleLeaveChat(userId, data, res) {
  const { chatId } = data;
  
  if (activeChats.has(chatId)) {
    const [user1, user2] = activeChats.get(chatId);
    const partnerId = user1 === userId ? user2 : user1;
    
    sendToUser(partnerId, { type: 'partner_left' });
    activeChats.delete(chatId);
  }
  
  res.json({ success: true });
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