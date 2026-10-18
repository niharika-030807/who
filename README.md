# WHO? — The Imposter Game ❓

A full-stack, real-time multiplayer social deduction and word game featuring a Cyber Neon theme.

Built with **React 18**, **Vite**, **Node.js / Express**, and **Socket.IO**. Supports multi-device room matchmaking, pass & play, offline bots, custom audio sound effects, light/dark mode, and instant deployment to Render.

---

## 📁 Repository Structure

The project is cleanly divided into independent **frontend** and **backend** applications, making it straightforward to deploy and maintain:

```text
imposter/
├── render.yaml               # 🚀 Render Blueprint for 1-click full-stack deployment
├── package.json              # Monorepo root helper scripts
├── .gitignore                # Global ignore rules
├── backend/                  # 🎮 Node.js + Express + Socket.IO Server
│   ├── package.json          # Backend dependencies (express, cors, socket.io)
│   ├── server.js             # Main server logic, room manager, bot AI, and socket events
│   ├── words.js              # Paired word database
│   ├── test_gameplay.js      # Automated multi-client integration test script
│   └── .gitignore            # Backend ignore rules
└── frontend/                 # ⚡ React 18 + Vite SPA Client
    ├── package.json          # Frontend dependencies (react, react-dom, socket.io-client)
    ├── vite.config.js        # Vite config with dev proxy for WebSockets
    ├── index.html            # Main HTML entrypoint with Bebas Neue & DM Sans fonts
    ├── public/               # Static assets & audio sound effects
    │   ├── bg-cyber.png
    │   └── sounds/           # Role reveal, dramatic, fail, and alert SFX
    ├── src/
    │   ├── App.jsx           # App state machine & Socket.IO connection orchestrator
    │   ├── main.jsx          # React DOM entrypoint
    │   ├── components/       # UI screens (Home, Lobby, Role Reveal, Hints, Vote, Result, etc.)
    │   ├── styles/           # Cyber theme stylesheets
    │   └── utils/            # Audio sound manager & word graphics
    └── .gitignore            # Frontend ignore rules
```

---

## ☁️ Deploying to Render

You can deploy to [Render](https://render.com) using either of the two methods below:

### Method 1: Automatic 1-Click Blueprint (Recommended)

This repository includes a [`render.yaml`](file:///c:/Users/TLIKITHA/OneDrive/Desktop/imposter/render.yaml) blueprint that configures both the backend Web Service and the frontend Static Site automatically.

1. Push this repository to your GitHub account.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository (`niharika-030807/who`).
5. Render will automatically detect `render.yaml` and configure:
   - **`who-imposter-backend`** (Node Web Service)
   - **`who-imposter-frontend`** (Static Site with automatic `VITE_SERVER_URL` binding)
6. Click **Apply**. Render will build and deploy both services!

---

### Method 2: Manual Setup on Render Dashboard

If you prefer to configure the services manually in the Render dashboard:

#### Step 1: Deploy the Backend (Web Service)
1. On Render, click **New +** > **Web Service**.
2. Select your repository.
3. Configure the fields:
   - **Name**: `who-imposter-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Click **Create Web Service**.
5. Once deployed, copy your backend URL (e.g. `https://who-imposter-backend.onrender.com`).

#### Step 2: Deploy the Frontend (Static Site)
1. On Render, click **New +** > **Static Site**.
2. Select your repository.
3. Configure the fields:
   - **Name**: `who-imposter-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Environment Variables**, add:
   - **Key**: `VITE_SERVER_URL`
   - **Value**: `https://who-imposter-backend.onrender.com` *(paste your backend URL from Step 1)*
5. Under **Redirects/Rewrites**, add a rewrite rule for Single Page Application routing:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

Your game is now live on the internet! 🚀

---

## 💻 Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Option A: Run Using Root Scripts
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Run backend server (http://localhost:3000)
npm run dev:backend

# In a second terminal, run frontend Vite dev server (http://localhost:5173)
npm run dev:frontend
```

### Option B: Run Inside Individual Folders

#### Backend:
```bash
cd backend
npm install
npm run dev
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing Backend Gameplay

To run the automated multi-client simulation test:
```bash
cd backend
node test_gameplay.js
```
This simulates 2 players + 1 AI bot joining a room, role assignment, clue submission, discussion, and voting end-to-end.
