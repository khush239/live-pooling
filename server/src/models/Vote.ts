import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
    pollId: mongoose.Types.ObjectId;
    studentName: string;
    optionId: string;
    createdAt: Date;
}

const VoteSchema: Schema = new Schema({
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
    studentName: { type: String, required: true },
    optionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Primary key index to prevent multiple votes per student per poll
VoteSchema.index({ pollId: 1, studentName: 1 }, { unique: true });

export default mongoose.model<IVote>('Vote', VoteSchema);
