# Super Kingdoms

A web-based game built with React, Vite, TypeScript, Convex, and Discord OAuth.

## Prerequisites

- Node.js 20+
- Docker (for local services)
- Discord account (for authentication)

## Setup

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Set up Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 > General
4. Add redirect: `https://localhost:5173/api/auth/callback/discord`
5. Copy Client ID and Secret to `.env.local`:

```bash
AUTH_DISCORD_ID=your_client_id
AUTH_DISCORD_SECRET=your_client_secret
```

### 3. Generate HTTPS certificates (for local development)

```bash
npm run generate-certs
```

This creates `dev.crt` and `dev.key` in the project root.

### 4. Start development server

```bash
npm run dev:https
npm run dev
```

This starts:
- Docker services (database, etc.)
- Vite dev server on `https://localhost:5173`
- Convex dev server
- TypeScript watcher

Without HTTPS certificates, the server runs on `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:https` | Start development server with HTTPS |
| `npm run dev` | Start development server |
| `npm run generate-certs` | Generate HTTPS certificates |
| `npm run build` | Build for production |
| `npm run lint:fix` | Run linter and fix issues |
| `npm run lint` | Run linter |
| `npm run test` | Run tests |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TanStack Router
- **Backend**: Convex (self-hosted)
- **Styling**: Pico CSS
- **Auth**: Discord OAuth via @convex-dev/auth
