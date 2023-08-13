# SafeStream Video Platform

A decentralized video-sharing platform integrating Worldcoin authentication, Livepeer streaming, NSFW content detection, and Ethereum attestations for content integrity.

## Features

- **Worldcoin OIDC Authentication**: Securely authenticate users and prevent bot registrations.
- **Livepeer Video Streaming**: Decentralized video streaming using Livepeer.
- **NSFW Content Detection**: Advanced detection of inappropriate content using TensorFlow.
- **Ethereum Attestations with Optimism**: Immutable attestations on the Ethereum blockchain for content integrity, optimized with the Optimism layer 2 scaling solution.
- **ReactJS Frontend**: Modern, responsive, and user-friendly interface.

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- Worldcoin OIDC credentials
- Livepeer API key
- Ethereum wallet with Optimism support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AvinashNayak27/superHack/
```

2. Navigate to the project directory:
```bash
cd secure-video-platform
```

3. Install the required packages:
```bash
npm install
```

4. Create a `.env` file in the root directory and fill in the necessary credentials:

```env
CLIENT_ID=YOUR_WORLD_COIN_CLIENT_ID
CLIENT_SECRET=YOUR_WORLD_COIN_CLIENT_SECRET
REDIRECT_URI=YOUR_REDIRECT_URI
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
WALLET_PRIVATE_KEY=YOUR_ETHEREUM_WALLET_PRIVATE_KEY
LIVEPEER_API_KEY=YOUR_LIVEPEER_API_KEY
```

5. Start the backend server one :
```bash
cd backend
node app.js
```
6. Start the backend server two :
```bash
cd safeCheckBackend
node index.js
```


6. Navigate to the frontend directory 
```bash
cd frontend
```

7. Install frontend dependencies:
```bash
npm install
```

8. Start the frontend development server:
```bash
npm start
```

## Usage

1. Register or log in using Worldcoin's OIDC.
2. Upload videos to the platform.
3. Videos are processed for streaming via Livepeer and checked for NSFW content.
4. Approved videos receive Ethereum attestations, verifying their integrity.
5. Browse and view videos on the platform. NSFW flagged videos will have appropriate warnings.
