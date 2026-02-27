import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
    socketId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    lastSeen: { type: Date, default: Date.now }
});

export default mongoose.model('Participant', ParticipantSchema);
