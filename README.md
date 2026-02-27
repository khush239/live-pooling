# Live Pooling System 🚀

A real-time, interactive polling system built for classrooms and live sessions. Teachers can create instant questions, and students can vote and see live-updating visual results.

## ✨ Features

- **Teacher Dashboard**: Create polls with multiple options, set timers, and mark correct answers.
- **Student Dashboard**: Real-time voting interface with live visual progress bars.
- **Live Pooling**: Instant percentage updates for all participants as votes are cast.
- **Visual Results**: Beautiful emerald green theme with dynamic bar-fill animations.
- **Participant Management**: Teacher can see active participants and manage the session.
- **Poll History**: View past questions and their final results.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion, Lucide React, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: MongoDB (Mongoose).
- **Styling**: Vanilla CSS with a custom modern design system.

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- MongoDB running locally or a MongoDB URI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/khush239/live-pooling.git
   cd live-pooling
   ```

2. Install dependencies:
   ```bash
   npm install && npm run build
   ```

## 🌐 Deployment

### Vercel Deployment (Live)

This project is configured for a **"Live" Vercel deployment** using a root `vercel.json`.

1. **Root Directory**: Ensure this is set to the **Project Root** (blank or `.`) in Vercel Settings.
2. **Environment Variables**: Add `MONGODB_URI` (from MongoDB Atlas).
3. **Build Command**: Vercel will automatically use the root `package.json` build scripts.

### Alternative Deployment (Render / Recommended)

For the best experience with persistent WebSockets (instant updates):
1. **New Web Service**: Connect your repo.
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**: Add `MONGODB_URI` and `NODE_ENV=production`.

## 📄 License

ISC
