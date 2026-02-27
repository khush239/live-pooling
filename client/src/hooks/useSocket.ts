import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

export const useSocket = (name: string, role: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);

    useEffect(() => {
        if (!name) return;

        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'], // Prefer polling for serverless/Vercel compatibility
            reconnection: true
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join', { name, role });
        });

        socket.on('participants_update', (data) => {
            setParticipants(data);
        });

        // Heartbeat for serverless environments
        const sendHeartbeat = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
                await axios.post(`${API_URL}/api/participants/heartbeat`, {
                    name,
                    role,
                    socketId: socket.id
                });
            } catch (e) {
                console.error('Heartbeat failed', e);
            }
        };

        // Send initial heartbeat
        sendHeartbeat();

        // Heartbeat interval
        const heartbeatInterval = setInterval(sendHeartbeat, 10000);

        // Polling fallback for participants
        const pollInterval = setInterval(async () => {
            if (!socket.connected) {
                try {
                    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
                    const res = await axios.get(`${API_URL}/api/participants`);
                    setParticipants(res.data);
                } catch (e) {
                    console.error('Participant poll failed', e);
                }
            }
        }, 5000);

        return () => {
            clearInterval(heartbeatInterval);
            clearInterval(pollInterval);
            socket.disconnect();
        };
    }, [name, role]);

    return { socket: socketRef.current, isConnected, participants };
};
