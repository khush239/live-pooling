import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (name: string, role: string) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);

    useEffect(() => {
        if (!name) return;

        const socket = io(SOCKET_URL);
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

        return () => {
            socket.disconnect();
        };
    }, [name, role]);

    return { socket: socketRef.current, isConnected, participants };
};
