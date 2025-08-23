# ORACLE LEND - DeFi Protocol

## Overview

ORACLE LEND is a decentralized finance (DeFi) protocol built on the Intuition testnet that combines lending, borrowing, and token swapping functionality. The platform allows users to supply assets to earn interest, borrow against collateral, and swap between tTRUST (native token) and ORACLE tokens. The project features a modern React-based frontend with TypeScript, providing a comprehensive DeFi experience with real-time analytics and seamless wallet integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React 19 architecture with TypeScript for type safety. The frontend is built with Vite for fast development and optimized builds. Component structure follows a modular approach with dedicated components for different protocol features (Dashboard, Lending/Borrowing, DEX, Analytics). Routing is handled by React Router DOM for seamless navigation between different sections.

### Styling and UI Framework
The UI leverages Tailwind CSS for utility-first styling with a custom cosmic/space theme. The design implements glassmorphism effects with backdrop filters and transparency for a modern look. A comprehensive color system is defined with primary, secondary, and accent colors, along with dark mode support controlled through Tailwind's class-based theming.

### State Management
State is managed through React hooks with custom hooks for different concerns:
- `useWallet` for wallet connection and blockchain interaction
- `useContract` for protocol-specific contract interactions
- `useAnalytics` for real-time protocol metrics and statistics

### Wallet Integration
The system integrates with MetaMask and other Ethereum-compatible wallets through the ethers.js library. Automatic network switching to Intuition testnet is implemented, with fallback to add the network if not present in the user's wallet. The wallet connection persists across sessions and handles network changes.

### Contract Architecture
Smart contract interactions are abstracted through custom hooks that handle:
- Lending pool operations (supply, withdraw, borrow, repay)
- Token swapping through an integrated DEX
- Real-time balance and position tracking
- Transaction status and error handling

## External Dependencies

### Blockchain Infrastructure
- **Intuition Testnet**: Custom EVM-compatible testnet for protocol deployment
- **MetaMask**: Primary wallet provider for user authentication and transaction signing
- **Ethers.js v6**: Ethereum library for blockchain interactions and contract communication

### UI and Styling
- **Tailwind CSS v4**: Utility-first CSS framework for responsive design
- **Font Awesome**: Icon library for consistent UI elements
- **Google Fonts (Inter)**: Typography system for clean, modern text rendering

### Development Tools
- **Vite v7**: Build tool and development server for fast compilation
- **TypeScript v5**: Static typing for enhanced development experience
- **PostCSS**: CSS processing with autoprefixer and cssnano for optimization
- **React Router DOM v7**: Client-side routing for single-page application navigation

### Protocol Tokens
- **tTRUST**: Native token of Intuition testnet (18 decimals)
- **ORACLE**: Protocol-specific ERC-20 token (18 decimals)
- **Exchange Rate**: 1 tTRUST = 100 ORACLE tokens

### External Services
- **Intuition Testnet Faucet**: Token distribution service for testing
- **Block Explorer**: Transaction and contract verification on Intuition testnet
- **RPC Endpoints**: WebSocket and HTTP connections for blockchain data