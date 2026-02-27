import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PollService from './services/PollService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling-system';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// State for real-time tracking
const activeParticipants = new Map();
const chatMessages: any[] = [];
let activeInterval: NodeJS.Timeout | null = null;

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (data) => {
        const { name, role } = data;

        // Enforce single teacher rule
        if (role === 'teacher') {
            for (const [id, user] of activeParticipants.entries()) {
                if (user.role === 'teacher' && id !== socket.id) {
                    const oldSocket = io.sockets.sockets.get(id);
                    if (oldSocket) {
                        oldSocket.emit('error', 'Another teacher session has started. You have been disconnected.');
                        oldSocket.disconnect();
                    }
                    activeParticipants.delete(id);
                }
            }
        }

        activeParticipants.set(socket.id, { id: socket.id, name, role });
        io.emit('participants_update', Array.from(activeParticipants.values()));

        // Send chat history
        socket.emit('chat_history', chatMessages);

        // Sync late-joiners immediately
        const poll = await PollService.getActivePoll();
        if (poll && poll.endTime) {
            const remaining = Math.max(0, Math.floor((poll.endTime.getTime() - new Date().getTime()) / 1000));
            socket.emit('timer_tick', { remaining });
        }
    });

    socket.on('send_message', (message) => {
        const user = activeParticipants.get(socket.id);
        if (user) {
            const chatMsg = {
                id: Date.now().toString(),
                user: user.name,
                text: message,
                timestamp: new Date()
            };
            chatMessages.push(chatMsg);
            if (chatMessages.length > 50) chatMessages.shift(); // Keep last 50
            io.emit('new_message', chatMsg);
        }
    });

    socket.on('kick_participant', (id) => {
        const socketToKick = io.sockets.sockets.get(id);
        if (socketToKick) {
            socketToKick.emit('kicked');
            socketToKick.disconnect();
        }
    });

    socket.on('create_poll', async (data) => {
        try {
            if (activeInterval) clearInterval(activeInterval);

            const poll = await PollService.createPoll(data);
            const enrichedPoll = await PollService.getEnrichedPoll(poll);
            io.emit('new_poll', enrichedPoll);

            // Timer synchronization broadcast
            let remaining = data.duration;
            activeInterval = setInterval(() => {
                remaining--;
                io.emit('timer_tick', { remaining });
                if (remaining <= 0) {
                    if (activeInterval) clearInterval(activeInterval);
                    activeInterval = null;
                    io.emit('poll_ended');
                }
            }, 1000);
        } catch (err) {
            console.error('Error creating poll:', err);
        }
    });

    socket.on('submit_vote', async (data) => {
        try {
            const { pollId, studentName, optionId } = data;
            await PollService.submitVote(pollId, studentName, optionId);

            const poll = await PollService.getActivePoll();
            if (!poll) return;

            const pollStats = await PollService.getEnrichedPoll(poll);
            io.emit('vote_update', pollStats);
        } catch (err: any) {
            socket.emit('error', err.message);
        }
    });

    socket.on('disconnect', () => {
        activeParticipants.delete(socket.id);
        io.emit('participants_update', Array.from(activeParticipants.values()));
        console.log('User disconnected');
    });
});

// API Routes
app.get('/api/active-poll', async (req, res) => {
    const poll = await PollService.getActivePoll();
    if (poll) {
        const enriched = await PollService.getEnrichedPoll(poll);
        return res.json(enriched);
    }
    res.json(null);
});

app.get('/api/history', async (req, res) => {
    const history = await PollService.getPollHistory();
    res.json(history);
});

// Serve static files in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../client', 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
