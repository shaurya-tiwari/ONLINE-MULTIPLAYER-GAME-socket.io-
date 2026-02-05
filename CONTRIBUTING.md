<p align="center">
  <img src="https://img.icons8.com/fluency/150/handshake.png" width="100"/>
</p>

<h1 align="center">🤝 Contributing to Stickman Race</h1>

<p align="center">
  <b>First off, thank you for considering contributing to Stickman Race!</b> 🎮<br/>
  <sub>Every contribution makes a difference, no matter how small!</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/🚀_All_Skill_Levels-WELCOME-4ECDC4?style=for-the-badge" alt="Welcome"/>
  <img src="https://img.shields.io/badge/💡_Your_Ideas-MATTER-FFE66D?style=for-the-badge" alt="Ideas Matter"/>
  <img src="https://img.shields.io/badge/🎯_Let's_Build-TOGETHER-FF6B6B?style=for-the-badge" alt="Together"/>
</p>

---

<br/>

## 📋 Table of Contents

| Section | Description |
|---------|-------------|
| [🌟 Ways to Contribute](#-ways-to-contribute) | Different ways you can help |
| [🛠️ Development Setup](#️-development-setup) | Get your environment ready |
| [📁 Project Structure](#-project-structure) | Understand the codebase |
| [🔄 Pull Request Process](#-pull-request-process) | How to submit changes |
| [🎨 Style Guidelines](#-style-guidelines) | Code formatting rules |
| [💬 Commit Messages](#-commit-messages) | How to write commits |
| [🎮 Testing](#-testing) | How to test your changes |

---

<br/>

## 🌟 Ways to Contribute

<table align="center">
<tr>
<td align="center" width="180">
<img src="https://img.icons8.com/fluency/96/bug.png" width="60"/><br/>
<b>🐛 Report Bugs</b><br/>
<sub>Found something broken?<br/>Let us know!</sub>
</td>
<td align="center" width="180">
<img src="https://img.icons8.com/fluency/96/idea.png" width="60"/><br/>
<b>💡 Suggest Features</b><br/>
<sub>Have a cool idea?<br/>Share it with us!</sub>
</td>
<td align="center" width="180">
<img src="https://img.icons8.com/fluency/96/code.png" width="60"/><br/>
<b>💻 Write Code</b><br/>
<sub>Fix bugs or add<br/>new features!</sub>
</td>
<td align="center" width="180">
<img src="https://img.icons8.com/fluency/96/design.png" width="60"/><br/>
<b>🎨 Create Art</b><br/>
<sub>Design skins, sprites,<br/>or backgrounds!</sub>
</td>
</tr>
</table>

<br/>

### � Good First Issues

Perfect for beginners! Start here:

| Task | Difficulty | Skills Needed |
|------|------------|---------------|
| 🎭 **Add Character Skins** | 🟢 Easy | Basic React, CSS |
| 🎵 **Add Sound Effects** | 🟢 Easy | Audio files, JS |
| 📝 **Improve Documentation** | 🟢 Easy | Markdown |
| 🏔️ **Create New Obstacles** | 🟡 Medium | JS, Game Logic |
| 🌍 **Add Map Themes** | 🟡 Medium | CSS, Design |
| 🌐 **Add Translations** | 🟡 Medium | i18n, Languages |
| 📱 **Improve Mobile UX** | 🟡 Medium | React, Touch Events |
| ⚡ **Optimize Performance** | 🔴 Hard | Profiling, Optimization |

---

<br/>

## 🛠️ Development Setup

### 📦 Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### ⬇️ Setup Steps

```bash
# 1️⃣ Fork this repository on GitHub (click the Fork button)

# 2️⃣ Clone your fork
git clone https://github.com/YOUR_USERNAME/stickman-race.git
cd stickman-race

# 3️⃣ Add upstream remote (to sync with main repo)
git remote add upstream https://github.com/shaurya-tiwari/stickman-race.git

# 4️⃣ Install dependencies
cd server && npm install
cd ../client && npm install

# 5️⃣ Start development servers
```

### ▶️ Running the Game

Open **two terminals**:

<table>
<tr>
<td width="50%">

**Terminal 1 — Server**
```bash
cd server
npm run dev
```
🟢 Server runs on `http://localhost:3000`

</td>
<td width="50%">

**Terminal 2 — Client**
```bash
cd client
npm run dev
```
🌐 Open `http://localhost:5173`

</td>
</tr>
</table>

---

<br/>

## 📁 Project Structure

```
� stickman-race/
│
├── 🎨 client/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── 📁 screens/             # Main app screens
│   │   │   ├── HomeScreen.jsx      # Landing page
│   │   │   ├── LobbyScreen.jsx     # Pre-race lobby
│   │   │   └── GameScreen.jsx      # Main gameplay
│   │   │
│   │   ├── 📁 components/          # Reusable UI components
│   │   │   ├── MobileControls.jsx  # Touch controls
│   │   │   ├── GameOverOverlay.jsx # Win/lose screen
│   │   │   └── OrientationGuard.jsx
│   │   │
│   │   ├── 📁 game/                # Game engine
│   │   │   ├── gameLoop.js         # Main game loop
│   │   │   ├── physics.js          # Movement & gravity
│   │   │   ├── collisions.js       # Collision detection
│   │   │   ├── animations.js       # Sprite animations
│   │   │   └── AssetLoader.js      # Preload images
│   │   │
│   │   ├── 📁 game-features/       # Special mechanics
│   │   │   ├── cameraShake.js      # Screen shake
│   │   │   ├── countdown.js        # Race countdown
│   │   │   └── visualEffects.js    # Particles
│   │   │
│   │   └── 📁 assets/              # Images & sprites
│   │       ├── stickman/           # Player sprites
│   │       ├── obstacles/          # Obstacle images
│   │       └── trees/              # Environment
│   │
│   └── package.json
│
├── ⚙️ server/                       # Backend (Node + Express)
│   ├── index.js                    # Server entry point
│   ├── socket.js                   # Socket.IO handlers
│   ├── rooms.js                    # Room management
│   ├── mapGenerator.js             # Procedural maps
│   └── raceLength.js               # Distance configs
│
└── 📸 screenshots/                  # Game screenshots
```

---

<br/>

## 🔄 Pull Request Process

### Step 1: Create a Branch

```bash
# Make sure you're on main branch
git checkout main

# Pull latest changes
git pull upstream main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
| Prefix | Use For |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `style/` | UI/CSS changes |

### Step 2: Make Your Changes

- ✅ Write clean, readable code
- ✅ Follow existing code style
- ✅ Add comments for complex logic
- ✅ Test your changes thoroughly

### Step 3: Commit Your Changes

```bash
git add .
git commit -m "feat: add double jump power-up"
```

### Step 4: Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then go to GitHub and click **"Create Pull Request"**

### Step 5: PR Checklist

Your PR should include:

- [ ] Clear title describing the change
- [ ] Description of what and why
- [ ] Screenshots/GIFs for UI changes
- [ ] Reference to related issues (if any)

---

<br/>

## 🎨 Style Guidelines

### JavaScript / React

```javascript
// ✅ GOOD - Clear names, proper spacing
const handlePlayerJump = (playerId) => {
    const player = players.get(playerId);
    if (player && player.canJump) {
        player.velocity.y = JUMP_FORCE;
    }
};

// ❌ BAD - Unclear names, no spacing
const hj = (id) => {
    const p = players.get(id);
    if(p&&p.canJump){p.velocity.y=JUMP_FORCE;}
};
```

### React Components

```jsx
// ✅ GOOD - Clean component structure
function PlayerCard({ name, score, isHost }) {
    return (
        <div className="player-card">
            <span className="name">{name}</span>
            <span className="score">{score}</span>
            {isHost && <span className="badge">Host</span>}
        </div>
    );
}
```

### Tailwind CSS

```jsx
// ✅ GOOD - Grouped utilities, readable
<button className="
    px-4 py-2 
    bg-blue-500 hover:bg-blue-600 
    text-white font-bold 
    rounded-lg transition-colors
">
    Start Race
</button>
```

---

<br/>

## 💬 Commit Messages

We use **Conventional Commits** format:

```
<type>: <description>

[optional body]
```

### Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add rope swing mechanic` |
| `fix` | Bug fix | `fix: player collision on mobile` |
| `docs` | Documentation | `docs: update README` |
| `style` | Formatting | `style: fix button alignment` |
| `refactor` | Code restructure | `refactor: simplify game loop` |
| `perf` | Performance | `perf: optimize sprite rendering` |
| `test` | Tests | `test: add collision tests` |
| `chore` | Maintenance | `chore: update dependencies` |

### Examples

```bash
# ✅ Good commit messages
git commit -m "feat: add double jump power-up"
git commit -m "fix: resolve collision detection on mobile"
git commit -m "docs: add installation instructions"
git commit -m "perf: optimize sprite rendering loop"

# ❌ Bad commit messages
git commit -m "fixed stuff"
git commit -m "update"
git commit -m "WIP"
```

---

<br/>

## 🎮 Testing

### Manual Testing Checklist

Before submitting your PR, make sure:

| Area | Check |
|------|-------|
| 🏠 **Home Screen** | ✅ Loads correctly |
| 🎮 **Create Room** | ✅ Room code generated |
| 🔗 **Join Room** | ✅ Can join with code |
| 🏃 **Gameplay** | ✅ Movement works |
| 📱 **Mobile** | ✅ Touch controls work |
| 🔄 **Multiplayer** | ✅ Players sync correctly |
| 🏆 **Winner Page** | ✅ Displays correct name |
| 🔄 **Host Restart** | ✅ Restarts with new map |
| 🚫 **No Errors** | ✅ Console is clean |

### Testing Multiplayer

1. Open the game in **two browser windows**
2. **Host** a game in one window
3. **Join** with the room code in the other
4. Test your feature in **both windows**

---

<br/>


<br/>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=80&section=footer" width="100%"/>
</p>

<p align="center">
  <b>🙏 Thank You for Contributing!</b><br/>
  <sub>Together, we're making Stickman Race better for everyone!</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Happy_Coding!-🎮-4ECDC4?style=for-the-badge" alt="Happy Coding"/>
</p>
