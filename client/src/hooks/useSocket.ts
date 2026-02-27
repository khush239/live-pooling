import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Polling fallback for participants in stateless environments
        const pollInterval = setInterval(async () => {
            if (!socket.connected) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/participants`);
                    const data = await res.json();
                    setParticipants(data);
                } catch (e) {
                    console.error('Participant poll failed', e);
                }
            }
        }, 5000);

        return () => {
            clearInterval(pollInterval);
            socket.disconnect();
        };
    }, [name, role]);

    return { socket: socketRef.current, isConnected, participants };
};
