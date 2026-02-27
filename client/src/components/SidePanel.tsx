import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, MessageSquare, Users } from 'lucide-react';

interface Props {
    socket: Socket | null;
    participants: any[];
    userName: string;
    isTeacher: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const SidePanel: React.FC<Props> = ({ socket, participants, userName, isTeacher, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat_history', (history) => setChatMessages(history));
        socket.on('new_message', (msg) => {
            setChatMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('chat_history');
            socket.off('new_message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const sendMessage = () => {
        if (!message.trim() || !socket) return;
        socket.emit('send_message', message);
        setMessage('');
    };

    const handleKick = (id: string) => {
        if (socket) socket.emit('kick_participant', id);
    };

    return (
        <div className={`side-panel ${isOpen ? 'open' : ''}`}>
            <div className="side-panel-header mobile-only">
                <button className="close-side-panel" onClick={onClose}>Close</button>
            </div>
            <div className="side-panel-tabs">
                <button
                    className={activeTab === 'chat' ? 'active' : ''}
                    onClick={() => setActiveTab('chat')}
                    title="Chat"
                >
                    <MessageSquare size={18} />
                </button>
                <button
                    className={activeTab === 'participants' ? 'active' : ''}
                    onClick={() => setActiveTab('participants')}
                    title="Participants"
                >
                    <Users size={18} />
                    <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>{participants.length}</span>
                </button>
            </div>

            <div className="side-panel-content">
                {activeTab === 'chat' ? (
                    <div className="chat-container">
                        <div className="messages-list">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`msg ${msg.user === userName ? 'own' : 'other'}`}>
                                    <span className="sender">{msg.user}</span>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-inputBox">
                            <div className="chat-input">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button onClick={sendMessage}><Send size={18} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="participants-list">
                        {participants.map((p) => (
                            <div key={p.id} className="participant-item">
                                <span className="participant-name">{p.name} {p.role === 'teacher' ? '(Teacher)' : ''}</span>
                                {isTeacher && p.role !== 'teacher' && (
                                    <button className="kick-btn" onClick={() => handleKick(p.id)}>Kick</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;
