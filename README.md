# Blockchain Chess Game - Next.js Version

A real-time multiplayer chess game built with Next.js, Socket.io, and blockchain integration.

## Features

- **Real-time Multiplayer Chess**: Play chess games in real-time with other players
- **Blockchain Integration**: Connect your MetaMask wallet and place bets on games
- **Smart Contract Integration**: Automated bet placement and winnings distribution
- **Responsive Design**: Modern UI built with Bootstrap
- **Game State Management**: Real-time game synchronization using Socket.io

## Tech Stack

- **Frontend**: Next.js, React, Bootstrap
- **Real-time Communication**: Socket.io
- **Blockchain**: Ethereum (Goerli Testnet), MetaMask, Ethers.js
- **Chess Engine**: chess.js, chessboard.js
- **Styling**: Bootstrap 5, Custom CSS

## Project Structure

```
socket-nextjs/
├── public/                 # Static assets
│   ├── css/               # Chessboard CSS
│   ├── js/                # Chess libraries and utilities
│   ├── img/               # Chess piece images
│   └── contract/          # Smart contract ABI and source
├── src/
│   └── pages/             # Next.js pages
│       ├── index.jsx      # Main lobby page
│       ├── white.jsx      # White player game page
│       ├── black.jsx      # Black player game page
│       ├── win.jsx        # Win celebration page
│       ├── lost.jsx       # Loss page
│       └── api/           # API routes
│           └── socket.js  # Socket.io API
├── server.js              # Custom server with Socket.io
├── config.js              # Configuration file
└── package.json           # Dependencies and scripts
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd socket-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3037`

## How to Play

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask wallet
2. **Create Game**: Enter a bet amount and game code, then click "Create game"
3. **Join Game**: Enter the game code provided by the creator and click "Join game"
4. **Play Chess**: Make moves on the chessboard - only legal moves are allowed
5. **Win/Lose**: The game ends when one player is checkmated or disconnects
6. **Claim Winnings**: Winners can claim their bet through the smart contract

## Smart Contract Integration

The game integrates with Ethereum smart contracts for:
- Game creation and bet placement
- Automatic winnings distribution
- Game state management on-chain

### Contract Addresses
- **Goerli Testnet**: `0x6996b280785d92fd957B77D623E455ABdFfBF2D6`

## Game Rules

- White always moves first
- Only legal chess moves are allowed
- Games end on checkmate or player disconnection
- Disconnected players automatically lose
- Bets are locked in smart contracts until game completion

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file:
```env
PORT=3037
NODE_ENV=development
```

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2024 Coullax All Rights Reserved

## Support

For support and questions, please contact the development team. 