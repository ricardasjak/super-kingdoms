# Welcome to Super Kingdoms!

This is not a real name, rather a placeholder for a game that I'm working on.
The game is built using [Remix](https://remix.run). Remix is a full-stack web framework for React.

# About the game

The game is a multiplayer online strategy game that is text based and runs in the browser.

## Development

### Prerequisites

- install latest [Node.js](https://nodejs.org/en), it will also install `npm` (Node Pakcage Manager)
- run `npm install` to install dependencies
- create local `.env` file, copy content from `.env.sample` and set your environment variables.
  You need to ask for Upstash and Clerk services secret keys, or create your own accounts.

### Run the app in dev mode

```sh
npm run dev
```
This starts your app in development mode, rebuilding assets on file changes.
Check [Remix Docs](https://remix.run/docs) for more information.

### Run code quality checks

```sh
npm run fix
```

## Deployment

You need to setup Fly.io utility to deploy the app to Fly.io platform.

```sh
npm run deploy
```

One day we may setup Gthub workflow to deploy the app automatically.

You can also deploy the app manually. First, build the app:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.
Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

# Technology stack

- Remix - full-stack web framework for React
- Typescript
- Tailwind CSS
- Upstash - Redis as a service, to store game state
- Clerk - user authentication
- Fly.io - platform to deploy the app
- GitHub - source control

## Game state handling

The game runs in quite unusual way to traditional web applications.
The game state is loaded at server start from Redis service (Upstash) and kept in memory (RAM).
The game state is updated in Redis only after some critical actions, like creation of a new kd or attack action.
All remaining state changes are saved in some intervals. So there is a risk of losing some data in case of server crash.

Such approach doesn't allow to host game in serverless environment, as we need to keep the game state in memory.
However, this approach makes game fast and responsive. And most importantly - makes development easier.
Once the game is stable, we may consider to make state management more reliable, and sync to the db on each action.

## A few words on code quality...

This is a hobby project and the game is in very early phase of development, the main focus is to ship some working prototype.
Some code duplication, lack of tests, some chaos in code structure is expected.

wip
