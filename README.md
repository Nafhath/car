# 🏎️ NEON DRIFT — Multiplayer Racing Game

A real-time multiplayer car racing game with neon visuals, drift mechanics, 6 car types, power-ups, and mobile touch controls.

## 🎮 Play

- **Single Player** — Race against 5 AI opponents
- **Multiplayer** — Race friends in real-time over the network

## 📂 Project Structure

```
├── frontend/     ← Static game files (deploy to Vercel)
│   ├── index.html
│   ├── style.css
│   ├── game.js
│   ├── renderer.js
│   └── network.js
├── backend/      ← WebSocket server (deploy to Render)
│   ├── server.js
│   └── package.json
```

## 🚀 Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Neon Drift multiplayer game"
git remote add origin https://github.com/YOUR_USERNAME/neon-drift.git
git push -u origin main
```

### 2. Deploy Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Deploy → Copy your URL (e.g., `https://neon-drift.onrender.com`)

### 3. Update Frontend Config

Edit `frontend/network.js` line 12:
```js
const WS_URL = 'wss://neon-drift.onrender.com'; // Your Render URL
```
Commit and push the change.

### 4. Deploy Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Other
4. Deploy!

## 🎮 Controls

| Desktop | Mobile |
|---------|--------|
| ↑ Accelerate | ▲ GAS button |
| ↓ Brake | ▼ BRK button |
| ← → Steer | ◀ ▶ buttons |
| SPACE Handbrake | ⟳ DRIFT button |

## 🏁 Features

- 6 unique cars: Sport, Muscle, Drift King, Supercar, Truck, Rally
- Car color customization with 8+ color options
- Mystery power-up boxes (Speed Boost, Shield, Nitro, Mega Grip, Slow Opponents, Mini Size)
- Real-time multiplayer with lobby system
- Drift scoring system
- Realistic physics with collision detection
- Mobile-responsive with touch controls
- Neon-themed visual design

## 🛠️ Local Development

```bash
# Run backend
cd backend
npm install
npm start

# Frontend — open in browser
# Just open frontend/index.html
# Or serve with: npx -y http-server frontend -p 8080
```

For local multiplayer, the WebSocket auto-detects `localhost:3000`.
