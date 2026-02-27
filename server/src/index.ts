import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PollService from './services/PollService';
import Participant from './models/Participant';
import ChatMessage from './models/ChatMessage';
import connectDB from './lib/db';

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

// MongoDB Connection management
connectDB();

// State for real-time tracking (Backups for Serverless)
// Note: Memory will be cleared on Vercel, so we use DB as source of truth
let activeInterval: NodeJS.Timeout | null = null;

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (data) => {
        const { name, role } = data;

        // Save participant to DB for cross-instance sync
        await Participant.findOneAndUpdate(
            { socketId: socket.id },
            { name, role, lastSeen: new Date() },
            { upsert: true }
        );

        const allParticipants = await Participant.find();
        io.emit('participants_update', allParticipants);

        // Send chat history from DB
        const history = await ChatMessage.find().sort({ timestamp: -1 }).limit(50);
        socket.emit('chat_history', history.reverse());

        // Sync late-joiners
        const poll = await PollService.getActivePoll();
        if (poll && poll.endTime) {
            const remaining = Math.max(0, Math.floor((poll.endTime.getTime() - new Date().getTime()) / 1000));
            socket.emit('timer_tick', { remaining });
        }
    });

    socket.on('send_message', async (message) => {
        const user = await Participant.findOne({ socketId: socket.id });
        if (user) {
            const chatMsg = new ChatMessage({
                user: user.name,
                text: message,
                timestamp: new Date()
            });
            await chatMsg.save();
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
            const poll = await PollService.createPoll(data);
            const enrichedPoll = await PollService.getEnrichedPoll(poll);
            io.emit('new_poll', enrichedPoll);
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

    socket.on('disconnect', async () => {
        await Participant.deleteOne({ socketId: socket.id });
        const allParticipants = await Participant.find();
        io.emit('participants_update', allParticipants);
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

app.get('/api/participants', async (req, res) => {
    // Cleanup old participants (not seen in last 30s)
    const timeout = new Date(Date.now() - 30000);
    await Participant.deleteMany({ lastSeen: { $lt: timeout } });

    const participants = await Participant.find();
    res.json(participants);
});

app.post('/api/participants/heartbeat', async (req, res) => {
    const { name, role, socketId } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    await Participant.findOneAndUpdate(
        { name, role }, // Match by user identity
        { socketId: socketId || 'polling', lastSeen: new Date() },
        { upsert: true }
    );
    res.json({ success: true });
});

app.get('/api/chat', async (req, res) => {
    const history = await ChatMessage.find().sort({ timestamp: -1 }).limit(50);
    res.json(history.reverse());
});

app.post('/api/chat', async (req, res) => {
    const { user, text } = req.body;
    const chatMsg = new ChatMessage({ user, text, timestamp: new Date() });
    await chatMsg.save();
    io.emit('new_message', chatMsg);
    res.json(chatMsg);
});

app.post('/api/poll', async (req, res) => {
    try {
        await connectDB();
        const poll = await PollService.createPoll(req.body);
        const enriched = await PollService.getEnrichedPoll(poll);
        io.emit('new_poll', enriched);
        res.json(enriched);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vote', async (req, res) => {
    try {
        await connectDB();
        const { pollId, studentName, optionId } = req.body;
        await PollService.submitVote(pollId, studentName, optionId);

        const poll = await PollService.getActivePoll();
        if (poll) {
            const pollStats = await PollService.getEnrichedPoll(poll);
            io.emit('vote_update', pollStats);
            return res.json(pollStats);
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static files in production
// const path = require('path');
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../../client/dist')));
//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, '../../client', 'dist', 'index.html'));
//     });
// }

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
