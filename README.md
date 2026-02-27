Live Pooling System 

A real-time, interactive polling system built for classrooms and live sessions. Teachers can create instant questions, and students can vote and see live-updating visual results.

Features

- **Teacher Dashboard**: Create polls with multiple options, set timers, and mark correct answers.
- **Student Dashboard**: Real-time voting interface with live visual progress bars.
- **Live Pooling**: Instant percentage updates for all participants as votes are cast.
- **Visual Results**: Beautiful emerald green theme with dynamic bar-fill animations.
- **Participant Management**: Teacher can see active participants and manage the session.
- **Poll History**: View past questions and their final results.

Tech Stack

- **Frontend**: React, Vite, Framer Motion, Lucide React, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: MongoDB (Mongoose).
- **Styling**: Vanilla CSS with a custom modern design system.

 Getting Started

 Prerequisites

- Node.js (v20+)
- MongoDB running locally or a MongoDB URI

 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/khush239/live-pooling.git
   cd live-pooling
   ```

2. Install dependencies for both parts:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

 Running Locally

You need to start both the server and the client:

1. **Start the Server**:
   ```bash
   cd server
   npm run dev
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000)*

2. **Start the Client**:
   ```bash
   cd client
   npm run dev
   ```
   *The client will run on [http://localhost:5173](http://localhost:5173)*


