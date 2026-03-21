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
1. Create Convex.dev account, do me a favor and create your account with [referal link](https://convex.dev/referral/RICARD2359)
2. Run `npm run dev:server`
   - You may need to log in to your convex account if this is your first time.
   - The script will automatically create a new project (named `sk-db-local`), set it as a local deployment, and automatically bind your `CONVEX_DEPLOYMENT` variables in `.env.local` without any prompts!

### 4. Start the Application

First, open a terminal and start the Convex backend server:

```bash
npm run dev:server
```

Then, in a new terminal tab, start the frontend and environment sync processes concurrently by running:

```bash
npm run dev
```

*(Note: During startup, our custom `setupEnv.mjs` script acts as a background process that will automatically listen for your backend to boot, read your `.env.local` Discord credentials, and securely inject them straight into your isolated Convex database automatically).*

- **Frontend:** `http://localhost:5173`
- **Convex API:** `http://localhost:3210`

---

## Available Commands

Most important commands:
- `npm run dev:server` - Starts the local Convex backend and database.
- `npm run dev` - Starts the Vite development server, TypeScript compiler, and environment pusher.
- `npm run lint:fix` - Auto-formats and fixes all safely fixable linting issues (bind this to run after save).
- `npm run test` - Runs unit tests using [Vitest](https://vitest.dev/).

Other commands:
- `npm run dev:server:dashboard` - Opens the Convex Admin Dashboard for your local convex db (server).
- `npm run lint` - Runs [Biome](https://biomejs.dev/) to check for linting errors.
- `npm run build` - Validates types and builds the Vite production artifact. 
- `npm run amend` - Automatically runs `npm run lint:fix`, adds all changes, and amends the last git commit.
