// Local test için basit HTTP server
const http = require('http');
const url = require('url');

const matchingQueue = [];
const activeChats = new Map();
const userConnections = new Map();

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'GET' && parsedUrl.pathname === '/api/socket') {
    // Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    const userId = parsedUrl.query.userId;
    if (!userId) {
      res.writeHead(400);
      res.end('userId required');
      return;
    }
    
    userConnections.set(userId, res);
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
    
    req.on('close', () => {
      userConnections.delete(userId);
      const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
      }
    });
    
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/socket') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { action, userId, data } = JSON.parse(body);
        
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
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid action' }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

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
  
  console.log(`${user.username} looking for match:`, filters);
  
  // Premium kontrolü
  if (user.gender === 'male' && filters.gender === 'female' && !user.isPremium) {
    res.writeHead(200);
    res.end(JSON.stringify({ error: 'PREMIUM_REQUIRED' }));
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
    
    activeChats.set(chatId, [userId, match.userId]);
    
    console.log(`Match found: ${user.username} <-> ${match.user.username}`);
    
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
    
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, chatId }));
  } else {
    // Kuyruğa ekle
    matchingQueue.push({
      userId,
      user,
      filters,
      timestamp: Date.now()
    });
    
    console.log(`${user.username} added to queue. Queue size: ${matchingQueue.length}`);
    
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, queued: true }));
    
    // 30 saniye timeout
    setTimeout(() => {
      const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
      if (queueIndex !== -1) {
        matchingQueue.splice(queueIndex, 1);
        sendToUser(userId, { type: 'match_timeout' });
        console.log(`${user.username} match timeout`);
      }
    }, 30000);
  }
}

function handleCancelMatch(userId, res) {
  const queueIndex = matchingQueue.findIndex(item => item.userId === userId);
  if (queueIndex !== -1) {
    matchingQueue.splice(queueIndex, 1);
    console.log(`User ${userId} cancelled match search`);
  }
  res.writeHead(200);
  res.end(JSON.stringify({ success: true }));
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
    
    console.log(`Message sent from ${userId} to ${partnerId}: ${content}`);
  }
  
  res.writeHead(200);
  res.end(JSON.stringify({ success: true }));
}

function handleLeaveChat(userId, data, res) {
  const { chatId } = data;
  
  if (activeChats.has(chatId)) {
    const [user1, user2] = activeChats.get(chatId);
    const partnerId = user1 === userId ? user2 : user1;
    
    sendToUser(partnerId, { type: 'partner_left' });
    activeChats.delete(chatId);
    
    console.log(`User ${userId} left chat ${chatId}`);
  }
  
  res.writeHead(200);
  res.end(JSON.stringify({ success: true }));
}

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

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Use this for local development testing');
});