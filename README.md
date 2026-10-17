# WHO? — The Imposter Game ❓

A full-stack, real-time multiplayer social deduction and word game with a Cyber Black, White, and Neon Blue theme.

Built with **React**, **Vite**, **Express**, and **Socket.IO**. Supports real-time multiplayer, pass & play, offline local servers, cloud server connections, and interactive bot testing.

---

## 🎮 Features

- **Cyber Aesthetic**:
  - Faithful typography using Google Fonts (**Bebas Neue** and **DM Sans**).
  - Sleek dark theme (`#030712`) with cyber grid background, radial neon glows, and animated mascot/eye indicators.
  - Authentic responsive layout optimized for mobile screens (`max-width: 480px`) and desktops.
- **Complete Game Loop**:
  1. **Home Screen**: Enter your nickname, create a room, or paste a room code to join directly.
  2. **Lobby**:
     - Real-time player list with host badges and connection indicators.
     - Host controls: Stepper for Imposter count (1 to N-1), toggle for **Ghost Mode** (the spy gets no word!).
     - Host security: Permission to kick disruptive players at any time.
     - Integrated in-game chat drawer across all gameplay screens.
     - **+ Add Bot Player** button: Instantly populate the lobby with AI bots to test or play solo without needing 3 real devices!
  3. **Role Reveal Screen**: Interactive card flip with 3D animation and sound effects. Civilians get their secret word with illustration and clues, imposters get their subtly different word (or no word in Ghost Mode).
  4. **Hints Round**: Turn-by-turn clue phase. Players submit single-word hints with a 1-minute timer while others see "thinking…".
  5. **Discussion Round**: Overview of all submitted clues for live debate. Host triggers the vote.
  6. **Voting Round**: Real-time anonymous voting with live vote tally. Handles tie votes and eliminations.
  7. **Ghost's Last Chance**: If caught, the Ghost gets one final guess to steal victory.
  8. **Results Screen**: Winner banner, secret words reveal, and complete role roster. Host can click **Play Again** to restart.
- **Synthesized Audio Effects**: Built-in Web Audio API sound generator for card flips, turn chimes, voting clicks, and victory fanfare (0 external assets required).
- **Dual Server Mode**:
  - Automatically connects to your local Express server (`http://localhost:3000`).
  - Switch to the live cloud server (`https://imposter-gameserver.onrender.com`) via the top navbar badge.

---

## 🚀 Quick Start

### 1. Run the Game Server & Client (All-in-One)
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

### 2. Run in Development Mode (Vite Hot-Reloading)
```bash
# Terminal 1: Run Backend Game Server
npm run dev:server

# Terminal 2: Run Vite Dev Server with HMR
npm run dev:client
```
Open **[http://localhost:5173](http://localhost:5173)**.

---

## 📁 Project Structure

```text
├── index.html                 # HTML shell with Google Fonts & meta tags
├── package.json               # Project dependencies and run scripts
├── server.js                  # Socket.IO game server with room management & bot AI
├── words.js                   # 60+ curated paired words database
├── vite.config.js             # Vite build & proxy configuration
├── test_gameplay.js           # Automated end-to-end integration test
└── src/
    ├── main.jsx               # React entrypoint
    ├── App.jsx                # Main application state machine & socket orchestrator
    ├── components/
    │   ├── HomeScreen.jsx     # Landing screen (Create / Join room)
    │   ├── LobbyScreen.jsx    # Room lobby, settings, bot adder & chat
    │   ├── RoleRevealScreen.jsx # 3D card flip role assignment
    │   ├── HintsScreen.jsx    # Clue submission with turn validation
    │   ├── DiscussionScreen.jsx # Clues summary & discussion
    │   ├── VoteScreen.jsx     # Real-time player voting
    │   ├── MrWhiteGuessScreen.jsx # Mr. White last-chance guess
    │   ├── ResultScreen.jsx   # Winner revelation & player roster
    │   └── ChatBox.jsx        # In-game real-time chat
    ├── styles/
    │   └── main.css           # Complete original design system styles
    └── utils/
        └── audio.js           # Web Audio procedural sound synthesizer
```

---

## 🧪 Testing

To run the automated multi-client end-to-end simulation:
```bash
node test_gameplay.js
```
This tests room creation, player joining, bot injection, role assignment, hint submission, discussion, voting, and game completion in 3 seconds.
