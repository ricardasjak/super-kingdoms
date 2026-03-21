# Super Kingdoms

Super Kingdoms is a React web application powered by [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router), and [Convex](https://convex.dev/) (Local Deployment) for the backend and database. It also uses [Convex Auth](https://labs.convex.dev/auth) for Discord Authentication and is styled elegantly with [PicoCSS](https://picocss.com/).

## Prerequisites

Before starting, make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Git**

## Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/ricardasjak/super-kingdoms
cd super-kingdoms
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and configure it as follows:

```env
SITE_URL=http://localhost:5173

# Discord OAuth
AUTH_DISCORD_ID=your_discord_client_id_here
AUTH_DISCORD_SECRET=your_discord_client_secret_here
```
#### Discord Application Setup
You can ask other developer to share his keys or create your own:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**.
3. Under the **OAuth2** tab, add the following to **Redirects**:
   ```text
   http://127.0.0.1:3211/api/auth/callback/discord
   ```
   *(Note: The port `3211` is specifically required because the Convex local proxy handles HTTP route callbacks on this port while the main database sits on `3210`).*
4. Copy your **Client ID** and **Client Secret**.

### 3. Convex setup (server)
1. Create a Convex.dev account, do me a favor and create your account with my [referral link](https://convex.dev/referral/RICARD2359)
2. **First-time Initialization:** Run `npm run dev:server:init` once!
   - You may need to log in to your convex account if this is your very first time.
   - The script will ask to create a new local DB and link it to cloud hosted Dashboard under your account. 
   - If you have multiple dev machines, don't try to use same DB link, create a new one for each machine! Single dev db instance against different branches may cause issues.
   - The script will automatically default to `local` deployment and bind your `CONVEX_DEPLOYMENT` variables into `.env.local` flawlessly!

### 4. Start the Application

Once initialized, start the entire full-stack application (Frontend, Convex Local Server, TypeScript compiler, and Env Synchronization) with a single command:

```bash
npm run dev
```

*(Note: During startup, our completely automated `setupEnv.mjs` worker script listens for your local database backend to boot up, dynamically verifies your local Convex Auth keys, and explicitly syncs your `.env.local` Discord credentials straight into your isolated Convex database container securely.)*

- **Frontend:** `http://localhost:5173`
- **Convex API:** `http://localhost:3210`

---

## Available Commands

Most important commands:
- `npm run dev` - Starts the Vite development server, local Convex database, TypeScript compiler, and environment pusher securely via `concurrently`.
- `npm run lint:fix` - Auto-formats and fixes all safely fixable linting issues (bind this to run after save).
- `npm run test` - Runs unit tests using [Vitest](https://vitest.dev/).

Other commands:
- `npm run dev:server:init` - One-time script to auto-provision and connect your local Convex backend.
- `npm run dev:server:dashboard` - Opens the Convex Admin Dashboard for your local convex db (server).
- `npm run lint` - Runs [Biome](https://biomejs.dev/) to check for linting errors.
- `npm run build` - Validates types and builds the Vite production artifact. 
- `npm run amend` - Automatically runs `npm run lint:fix`, adds all changes, and amends the last git commit.
