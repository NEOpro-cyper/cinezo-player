# CineZo Player

An elegant, feature-rich video player built with Next.js 14, Vidstack, and Tailwind CSS.

## ✨ Features

- 🎬 **Multi-Server Support** - Automatically switches between servers with fallback
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- ⌨️ **Full Keyboard Shortcuts** - Complete control without mouse
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 💾 **Watch History** - Persists progress across sessions
- 🎚️ **Subtitle Support** - Multiple subtitle tracks with customization
- ⚡ **Playback Speed** - Adjust from 0.25x to 2x
- 🖥️ **Quality Selection** - Auto, 1080p, 720p, 480p
- 🔊 **Audio Track Selection** - Multiple dub/language options
- 🌐 **Deploy Anywhere** - Vercel, VPS, Docker supported

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Docker

```bash
# Build image
docker build -t cinezo-player .

# Run container
docker run -p 3000:3000 cinezo-player
```

### VPS / Manual

```bash
# Clone repository
git clone https://github.com/your-username/cinezo-player.git
cd cinezo-player

# Install dependencies
npm install

# Build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start npm --name "cinezo-player" -- start
```

## 🛤️ Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with demo form |
| `/movie/[id]` | Movie player |
| `/tv/[id]/[season]/[episode]` | TV show player |

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/servers` | Get available servers |
| `GET /api/movie/[id]/[server]` | Get movie source |
| `GET /api/tv/[id]/[season]/[episode]/[server]` | Get TV source |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play/Pause |
| `F` | Toggle Fullscreen |
| `M` | Mute/Unmute |
| `←` / `J` | Seek -10s |
| `→` / `L` | Seek +10s |
| `Shift + ←` | Seek -30s |
| `Shift + →` | Seek +30s |
| `↑` / `↓` | Volume Up/Down |
| `<` / `>` | Speed -/+ 0.25x |
| `N` | Next Episode |
| `P` | Previous Episode |
| `S` | Settings Panel |
| `0-9` | Seek to 0%-90% |

## 🏗️ Project Structure

```
cinezo-player/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── servers/route.ts      # Servers list API
│   │   │   ├── movie/[id]/[server]/  # Movie source API
│   │   │   └── tv/[...]/             # TV source API
│   │   ├── movie/[id]/page.tsx       # Movie player page
│   │   ├── tv/[id]/[season]/[episode]/page.tsx  # TV player page
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home page
│   │   └── globals.css
│   ├── components/
│   │   └── player/
│   │       ├── Player.tsx            # Main player component
│   │       ├── VideoPlayer.tsx       # Vidstack player
│   │       ├── ServerPanel.tsx       # Server selection
│   │       ├── SettingsPanel.tsx     # Settings modal
│   │       ├── LoadingOverlay.tsx    # Loading spinner
│   │       ├── Toast.tsx             # Notifications
│   │       └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   └── api.ts                    # API utilities
│   └── store/
│       └── player-store.ts           # Zustand store
├── public/
├── Dockerfile
├── vercel.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔧 Configuration

### Environment Variables

No environment variables required! The player works out of the box.

### Custom API Base

To use a different API, modify `src/lib/api.ts`:

```typescript
const API_BASE = 'https://your-api.com';
```

## 📝 License

MIT License - feel free to use for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
