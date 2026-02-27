import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { usePollTimer } from '../hooks/usePollTimer';
import { Clock, MessageSquare, LogOut } from 'lucide-react';

interface Props {
    name: string;
    socket: Socket | null;
    participants: any[];
    onToggleSidebar: () => void;
}

const StudentDashboard: React.FC<Props> = ({ name, socket, participants: _participants, onToggleSidebar }) => {
    const [activePoll, setActivePoll] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [serverTime, setServerTime] = useState<number | null>(null);
    const timeLeft = usePollTimer(serverTime);

    useEffect(() => {
        fetchActivePoll();

        if (socket) {
            socket.on('new_poll', (poll) => {
                setActivePoll(poll);
                setSelectedOption(null);
                setHasVoted(false);
                setServerTime(poll.duration);
            });

            socket.on('timer_tick', (data) => {
                setServerTime(data.remaining);
            });

            socket.on('vote_update', (pollStats) => {
                setActivePoll((prev: any) => {
                    if (prev && String(pollStats._id) === String(prev._id)) {
                        return pollStats;
                    }
                    return prev;
                });
            });

            socket.on('poll_ended', () => {
                setServerTime(0);
            });
        }

        // Polling fallback for active poll
        const activePollInterval = setInterval(() => {
            if (!socket || !socket.connected) {
                fetchActivePoll();
            }
        }, 5000);

        return () => {
            socket?.off('new_poll');
            socket?.off('timer_tick');
            socket?.off('vote_update');
            socket?.off('poll_ended');
            clearInterval(activePollInterval);
        };
    }, [socket]);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

    const fetchActivePoll = async () => {
        const res = await axios.get(`${API_URL}/api/active-poll`);
        if (res.data) {
            setActivePoll(res.data);
            // Calculate remaining time from server endTime
            const end = new Date(res.data.endTime).getTime();
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));
            setServerTime(remaining);
        }
    };

    const handleVote = async () => {
        if (!selectedOption || !activePoll || hasVoted || timeLeft === 0) return;

        if (socket?.connected) {
            socket.emit('submit_vote', {
                pollId: activePoll._id,
                studentName: name,
                optionId: selectedOption
            });
        } else {
            // Fallback to REST API
            try {
                const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
                await axios.post(`${API_URL}/api/vote`, {
                    pollId: activePoll._id,
                    studentName: name,
                    optionId: selectedOption
                });
            } catch (err: any) {
                console.error('API Vote failed:', err.message);
                return; // Don't set hasVoted if it failed
            }
        }
        setHasVoted(true);
    };

    if (!activePoll || timeLeft === 0) {
        return (
            <div className="dashboard-container">
                <div className="header">
                    <div className="user-info">
                        <div className="avatar">{name[0].toUpperCase()}</div>
                        <div>
                            <h2>{name}</h2>
                            <p>Student</p>
                        </div>
                    </div>
                    <div className="nav-actions">
                        <button onClick={onToggleSidebar} className="mobile-only chat-toggle"><MessageSquare size={20} /></button>
                        <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="logout"><LogOut size={20} /></button>
                    </div>
                </div>
                <div className="poll-area">
                    <div className="wait-container">
                        <div className="loader"></div>
                        <h1>Wait for the teacher to ask questions..</h1>
                        {activePoll && (
                            <div className="final-results">
                                <h3>Last Poll Results</h3>
                                {activePoll.options.map((opt: any) => {
                                    const stats = activePoll.stats?.find((s: any) => s.id === opt.id);
                                    const count = stats?.count || 0;
                                    const total = activePoll.totalVotes || 1;
                                    const percent = Math.round((count / total) * 100) || 0;
                                    return (
                                        <div key={opt.id} className="result-bar">
                                            <span>{opt.text}</span>
                                            <div className="bar"><div style={{ width: `${percent}%` }}></div></div>
                                            <span>{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="header">
                <div className="user-info">
                    <div className="avatar">{name[0].toUpperCase()}</div>
                    <div>
                        <h2>{name}</h2>
                        <p>Student</p>
                    </div>
                </div>
                <div className="nav-actions">
                    <button onClick={onToggleSidebar} className="mobile-only chat-toggle"><MessageSquare size={20} /></button>
                    <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="logout"><LogOut size={20} /></button>
                </div>
            </div>

            <div className="poll-area">
                <div className="student-dashboard">
                    <div className="poll-header">
                        <div className="badge">Active Poll</div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="vote-count" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                {activePoll.totalVotes || 0} votes
                            </div>
                            <div className="timer"><Clock size={16} /> 00:{String(timeLeft).padStart(2, '0')}</div>
                        </div>
                    </div>

                    <div className="question-box">
                        {activePoll.question}
                    </div>

                    <div className="options-grid">
                        {activePoll.options.map((opt: any, idx: number) => {
                            const count = activePoll.stats?.find((s: any) => s.id === opt.id)?.count || 0;
                            const total = activePoll.totalVotes || 0;
                            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div
                                    key={opt.id}
                                    className={`option-card ${selectedOption === opt.id ? 'selected-answer' : ''} ${hasVoted ? 'disabled' : ''}`}
                                    style={{ position: 'relative', overflow: 'hidden' }}
                                    onClick={() => !hasVoted && setSelectedOption(opt.id)}
                                >
                                    {/* Visual Progress Bar */}
                                    {total > 0 && (
                                        <div
                                            className="bar-fill"
                                            style={{
                                                width: `${percent}%`,
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                height: '100%',
                                                zIndex: 0,
                                                opacity: 0.15
                                            }}
                                        ></div>
                                    )}

                                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', width: '100%', gap: '20px' }}>
                                        <span className="idx">{idx + 1}</span>
                                        <span className="text" style={{ flex: 1 }}>{opt.text}</span>
                                        {total > 0 && (
                                            <div className="vote-progress" style={{ position: 'static', marginLeft: 'auto' }}>
                                                {percent}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!hasVoted && (
                        <button
                            className="btn-primary submit-vote"
                            disabled={!selectedOption}
                            onClick={handleVote}
                        >
                            Submit Vote
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
