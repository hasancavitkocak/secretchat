# Secret Chat

A modern anonymous chat application built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## Features

- **Anonymous Chatting**: No email or phone registration required
- **Device-based Identity**: Each user identified by localStorage UUID
- **Gender Selection**: Initial onboarding for gender selection
- **Real-time Matching**: Queue-based matching system with 30s timeout
- **Smart Filtering**: Filter by gender and interests with compatibility check
- **Premium Features**: Male users need premium to match with females
- **Friend System**: Send friend requests and maintain connections
- **Cancel Search**: Ability to cancel ongoing match search
- **Real-time Simulation**: Mock real-time messaging with local state
- **Modern UI**: Dark mode, smooth animations, responsive design

## Pages

- **Home (/)**: Welcome page with app introduction
- **Search (/search)**: Find matches with filtering options
- **Chat (/chat)**: Real-time chat interface with friend requests
- **Friends (/friends)**: Manage friend connections
- **Settings (/settings)**: Edit username and clear data

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Storage**: localStorage (no backend yet)

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Install server dependencies:
```bash
cd server && npm install && cd ..
```

3. Run the development server:
```bash
npm run dev
```

4. In another terminal, start the WebSocket server:
```bash
cd server && npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy - Vercel will automatically handle both the Next.js app and WebSocket API routes

The app automatically detects the environment and uses:
- **Development**: Local WebSocket server (localhost:3001)
- **Production**: Vercel API routes (/api/socket)

## Project Structure

```
app/
├── page.tsx          # Home page
├── search/page.tsx   # Match finding
├── chat/page.tsx     # Chat interface
├── friends/page.tsx  # Friends list
├── settings/page.tsx # User settings
└── layout.tsx        # Root layout

components/
├── ui/               # shadcn/ui components
├── FilterModal.tsx   # Match filtering
├── PremiumDialog.tsx # Premium upgrade
├── ChatBubble.tsx    # Message display
├── FriendCard.tsx    # Friend list item
└── Navigation.tsx    # Bottom navigation

lib/
├── types.ts          # TypeScript types
├── storage.ts        # localStorage utilities
├── matching.ts       # Match finding logic
└── utils.ts          # General utilities
```

## Features Implementation

### Anonymous Identity
- Auto-generated UUID on first visit
- Stored in localStorage with username
- No personal information required

### Matching System
- Gender and interest-based filtering
- Premium requirement for male→female matching
- Mock user pool for demonstration

### Chat System
- Real-time message simulation
- Friend request functionality
- Chat history management

### Premium Features
- Three pricing tiers (Daily, Monthly, Yearly)
- Mock payment system
- Unlocks female matching for males

## WebSocket Implementation

The app now includes a complete WebSocket implementation for real-time features:

### Features
- **Real-time Matching**: Queue-based system with instant notifications
- **Live Messaging**: Instant message delivery between users
- **Connection Status**: Online/offline indicators
- **Graceful Fallback**: Works without WebSocket server (mock mode)

### Architecture
- **Frontend**: Socket.io-client with React hooks
- **Backend**: Node.js + Socket.io server
- **Fallback**: localStorage-based mock system

### WebSocket Events
- `find_match` - Start looking for a match
- `cancel_match` - Cancel ongoing search
- `match_found` - Match discovered
- `send_message` - Send chat message
- `message` - Receive chat message
- `partner_left` - Chat partner disconnected

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication & profiles
- Push notifications
- Image/file sharing
- Voice messages
- Video calls
- Group chats
- Message encryption

## License

MIT License