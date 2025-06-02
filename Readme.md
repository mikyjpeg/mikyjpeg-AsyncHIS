# AsyncHIS - Here I Stand Discord Bot and Web Application

This project provides a Discord bot and a React web application to facilitate playing the board game "Here I Stand" by GMT in an asynchronous mode.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [.env File Configuration](#env-file-configuration)
- [Running the Project](#running-the-project)
- [Deploying Commands](#deploying-commands)

## Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: It is recommended to use an LTS (Long Term Support) version of Node.js (e.g., Node.js 18.x or 20.x). You can download it from [nodejs.org](https://nodejs.org/).
-   **npm**: Node Package Manager, which comes bundled with Node.js.

## Setup

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/mikyjpeg/AsyncHIS.git
    cd AsyncHIS
    ```

2.  **Install dependencies**:

    This project uses `npm` workspaces. Run the following command from the root directory to install dependencies for both the bot and the client (web app):

    ```bash
    npm run install:all
    ```

    Alternatively, you can run `npm install` in the root directory and then navigate to the `client` directory and run `npm install` there:

    ```bash
    npm install
    cd client
    npm install
    cd ..
    ```

## .env File Configuration

Create a `.env` file in the root directory of the project (`AsyncHIS/.env`) with the following content. Replace the placeholder values with your actual Discord application and server details. **Ensure this file is not committed to version control as it contains sensitive information.**

```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=1377699504404566077
NODE_ENV=development
DEV_GUILD_ID=YOUR_DISCORD_TEST_GUILD_ID
```

-   `DISCORD_TOKEN`: Your Discord bot token. You can get this from the [Discord Developer Portal](https://discord.com/developers/applications) under your application's "Bot" section. Click "Reset Token" to reveal it (if you haven't already).
-   `CLIENT_ID`: The client ID of your Discord application. Found under "General Information" in the [Discord Developer Portal](https://discord.com/developers/applications).
-   `NODE_ENV`: Set to `development` for local development. This can be `production` for deployment.
-   `DEV_GUILD_ID`: The ID of the Discord server (guild) where you want to test your commands. To get your Guild ID, enable "Developer Mode" in Discord settings (User Settings > Advanced > Developer Mode), then right-click on your server icon and select "Copy ID". This is important for deploying development commands.

## Running the Project

You can run the Discord bot and the web application separately or concurrently.

### Run both concurrently (development mode)

This command will start both the Discord bot (using `nodemon` for auto-restarts on file changes) and the React web application.

```bash
npm run dev
```

### Run the Discord Bot only (development mode)

```bash
npm run dev:bot
```

### Run the Web Application only (development mode)

```bash
npm run dev:client
```

### Run the Discord Bot (production mode)

```bash
npm start
```

## Deploying Commands

After making changes to your Discord commands, you need to deploy them to Discord's API so they appear in your server.

### Deploy Development Commands (to a specific test guild)

This is recommended for development as it updates commands almost instantly on the `DEV_GUILD_ID` specified in your `.env` file.

```bash
npm run deploy-commands:dev
```

### Deploy Production Commands (globally)

This will deploy commands globally to all guilds where your bot is added. This can take up to an hour to propagate.

```bash
npm run deploy-commands:prod
``` 