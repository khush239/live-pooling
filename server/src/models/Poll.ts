import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface IPoll extends Document {
    question: string;
    options: IOption[];
    duration: number; // in seconds
    isActive: boolean;
    startTime: Date | null;
    endTime: Date | null;
    createdAt: Date;
}

const PollSchema: Schema = new Schema({
    question: { type: String, required: true },
    options: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true }
    }],
    duration: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPoll>('Poll', PollSchema);
