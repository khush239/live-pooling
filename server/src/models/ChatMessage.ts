import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('ChatMessage', ChatMessageSchema);
