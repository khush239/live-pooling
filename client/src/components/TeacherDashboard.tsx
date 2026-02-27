import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { Plus, History, LogOut, ChevronDown, MessageSquare } from 'lucide-react';

interface Props {
    name: string;
    socket: Socket | null;
    participants: any[];
    onToggleSidebar: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ name, socket, participants: _participants, onToggleSidebar }) => {
    const [view, setView] = useState<'create' | 'live' | 'history'>('create');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState([
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
    ]);
    const [duration, setDuration] = useState(60);
    const [activePoll, setActivePoll] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchActivePoll();
        fetchHistory();

        if (socket) {
            socket.on('vote_update', (pollStats) => {
                setActivePoll(pollStats);
            });
            socket.on('new_poll', (poll) => {
                setActivePoll(poll);
                setView('live');
            });
            socket.on('poll_ended', () => {
                fetchHistory();
            });
        }

        return () => {
            socket?.off('vote_update');
            socket?.off('new_poll');
            socket?.off('poll_ended');
        };
    }, [socket]);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

    const fetchActivePoll = async () => {
        const res = await axios.get(`${API_URL}/api/active-poll`);
        if (res.data) {
            setActivePoll(res.data);
            setView('live');
        }
    };

    const fetchHistory = async () => {
        const res = await axios.get(`${API_URL}/api/history`);
        setHistory(res.data);
    };

    const handleCreatePoll = () => {
        if (!question || options.some(o => !o.text) || !options.some(o => o.isCorrect)) return;
        socket?.emit('create_poll', { question, options, duration });
        setQuestion('');
        setOptions([{ id: '1', text: '', isCorrect: false }, { id: '2', text: '', isCorrect: false }]);
    };

    const addOption = () => {
        setOptions([...options, { id: Date.now().toString(), text: '', isCorrect: false }]);
    };

    return (
        <div className="dashboard-container">
            <div className="header">
                <div className="user-info">
                    <div className="avatar">RB</div>
                    <div>
                        <h2>{name}</h2>
                        <p>Teacher</p>
                    </div>
                </div>
                <div className="nav-actions">
                    <button onClick={onToggleSidebar} className="mobile-only chat-toggle"><MessageSquare size={20} /></button>
                    <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}><History size={20} /> <span className="hide-mobile">History</span></button>
                    <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="logout"><LogOut size={20} /></button>
                </div>
            </div>

            <div className="poll-area">
                {view === 'create' && (
                    <div className="create-poll">
                        <div className="poll-form-header">
                            <h3>Create New Poll</h3>
                            <div className="duration-select">
                                <span>{duration === 120 ? '2m' : `${duration}s`}</span>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }}
                                >
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>60 seconds</option>
                                    <option value={120}>2 minutes</option>
                                </select>
                                <ChevronDown size={18} />
                            </div>
                        </div>

                        <div className="typing-area-container">
                            <textarea
                                placeholder="Ex: Which planet is known as the Red Planet?"
                                value={question}
                                maxLength={100}
                                onChange={e => setQuestion(e.target.value)}
                            />
                            <div className="char-counter">{question.length}/100</div>
                        </div>

                        <div className="options-section">
                            <div className="options-section-header">
                                <div className="left"><h4>Edit Options</h4></div>
                                <div className="right"><h4>Is it Correct?</h4></div>
                            </div>

                            <div className="options-list">
                                {options.map((opt, idx) => (
                                    <div key={opt.id} className="option-row">
                                        <div className="opt-input-wrapper">
                                            <div className="opt-num">{idx + 1}</div>
                                            <input
                                                type="text"
                                                value={opt.text}
                                                placeholder="Option text"
                                                onChange={e => {
                                                    const newOpts = [...options];
                                                    newOpts[idx].text = e.target.value;
                                                    setOptions(newOpts);
                                                }}
                                            />
                                        </div>
                                        <div className="correct-selector">
                                            <div
                                                className={`radio-btn ${opt.isCorrect ? 'active' : ''}`}
                                                onClick={() => {
                                                    const newOpts = options.map((o, i) => ({
                                                        ...o,
                                                        isCorrect: i === idx
                                                    }));
                                                    setOptions(newOpts);
                                                }}
                                            >
                                                <div className="circle"></div>
                                                Yes
                                            </div>
                                            <div
                                                className={`radio-btn ${!opt.isCorrect ? 'active' : ''}`}
                                                onClick={() => {
                                                    const newOpts = [...options];
                                                    newOpts[idx].isCorrect = false;
                                                    setOptions(newOpts);
                                                }}
                                            >
                                                <div className="circle"></div>
                                                No
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addOption} className="add-more-btn"><Plus size={20} /> Add More option</button>
                            </div>
                        </div>

                        <div className="poll-footer">
                            <button
                                className="ask-btn-large"
                                onClick={handleCreatePoll}
                                disabled={!question || options.some(o => !o.text) || !options.some(o => o.isCorrect)}
                                style={{ opacity: (!question || options.some(o => !o.text) || !options.some(o => o.isCorrect)) ? 0.5 : 1 }}
                            >
                                Ask Question
                            </button>
                        </div>
                    </div>
                )}

                {view === 'live' && activePoll && (
                    <div className="live-results">
                        <h2>Question</h2>
                        <div className="question-box">{activePoll.question}</div>
                        <div className="results-list">
                            {activePoll.options.map((opt: any) => {
                                const stats = activePoll.stats?.find((s: any) => s.id === opt.id);
                                const count = stats?.count || 0;
                                const total = activePoll.totalVotes || 1;
                                const percent = Math.round((count / total) * 100) || 0;

                                return (
                                    <div key={opt.id} className="result-item">
                                        <div className="bar-bg">
                                            <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                                            <span className="opt-text">{opt.text}</span>
                                            <span className="opt-percent">{percent}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
                            <button className="ask-btn-large" onClick={() => setView('create')}>+ Ask a new question</button>
                        </div>
                    </div>
                )}

                {view === 'history' && (
                    <div className="history-list">
                        <div className="history-header">
                            <button className="back-btn" onClick={() => setView('create')}>
                                ← Ask Question
                            </button>
                            <h1>View <span>Poll History</span></h1>
                        </div>
                        {history.map((poll, idx) => (
                            <div key={poll._id} className="history-item">
                                <h3>Question {idx + 1}</h3>
                                <div className="question-box">{poll.question}</div>
                                <div className="results-list">
                                    {poll.stats.map((stat: any) => (
                                        <div key={stat.id} className="result-item mini">
                                            <span className="opt-text">{stat.text}</span>
                                            <span className="opt-count">{stat.count} votes</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
