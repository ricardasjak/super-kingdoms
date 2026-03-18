# Super Kingdoms

Super Kingdoms is a React web application powered by [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router), and [Convex](https://convex.dev/) (Self-Hosted via Docker) for the backend and database. It also uses [Convex Auth](https://labs.convex.dev/auth) for Discord Authentication and is styled elegantly with [PicoCSS](https://picocss.com/).

## Prerequisites

Before starting, make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Docker & Docker Compose** (Required to run the self-hosted Convex local database)
- **Git**

## Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/ricardasjak/super-kingdoms
cd super-kingdoms
npm install
```

### 2. Discord Application Setup
Since the app uses Discord for authentication, you need to create a Discord application:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Under the **OAuth2** tab, add the following to **Redirects**:
   ```text
   http://127.0.0.1:3211/api/auth/callback/discord
   ```
   *(Note: The port `3211` is specifically required because the self-hosted Convex proxy handles HTTP route callbacks on this port while the main database sits on `3210`).*
4. Copy your **Client ID** and **Client Secret**.

### 3. Environment Variables
Create a `.env.local` file in the root directory and configure it as follows:

```env
# Self-Hosted Convex Configuration
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
# (You may need to provide a default self-hosted admin key if your backend requires it)
CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted|01603646c7c34324855bc39a4fc53319be3128af2f81573b7b168cecc63733037586cde52e

# Frontend & Auth Network Definitions 
VITE_CONVEX_URL=http://127.0.0.1:3210
CONVEX_SITE_URL=http://127.0.0.1:3211
SITE_URL=http://localhost:5173

# Discord OAuth
AUTH_DISCORD_ID=your_discord_client_id_here
AUTH_DISCORD_SECRET=your_discord_client_secret_here
```

### 4. Start the Application

Start all services (the Docker backend, the Convex dev sync, the TypeScript compiler, and the Vite server) concurrently by running:

```bash
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Convex Admin Dashboard:** `http://localhost:6791` (If prompted to log in upon opening, use the `CONVEX_SELF_HOSTED_ADMIN_KEY` string from your environment file!)
- **Convex API:** `http://localhost:3210`

---

## Available Commands

- `npm run dev` - Starts the entire local development stack.
- `npm run lint` - Runs [Biome](https://biomejs.dev/) to check for linting errors.
- `npm run lint:fix` - Auto-fixes all safely fixable linting issues.
- `npm run test` - Runs unit tests using [Vitest](https://vitest.dev/).
- `npm run build` - Validates types and builds the Vite production artifact. 
- `npm run amend` - Automatically runs the Biome fix, adds all changes, and amends the last git commit (useful for rapid iterative local workflows).
