import Poll, { IPoll } from '../models/Poll';
import Vote from '../models/Vote';

class PollService {
    async createPoll(data: any): Promise<IPoll> {
        // Deactivate any existing active polls
        await Poll.updateMany({ isActive: true }, { isActive: false });

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + data.duration * 1000);

        const poll = new Poll({
            ...data,
            isActive: true,
            startTime,
            endTime
        });

        return await poll.save();
    }

    async getActivePoll(): Promise<IPoll | null> {
        const now = new Date();
        const poll = await Poll.findOne({
            isActive: true,
            endTime: { $gt: now }
        });

        if (!poll) {
            // Mark all as inactive if time passed
            await Poll.updateMany({ isActive: true, endTime: { $lte: now } }, { isActive: false });
        }

        return poll;
    }

    async getPollHistory(): Promise<any[]> {
        const polls = await Poll.find().sort({ createdAt: -1 });
        const history = await Promise.all(polls.map(async (poll) => {
            const votes = await Vote.find({ pollId: poll._id });
            const stats = poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                isCorrect: opt.isCorrect,
                count: votes.filter(v => v.optionId === opt.id).length
            }));
            return {
                ...poll.toObject(),
                totalVotes: votes.length,
                stats
            };
        }));
        return history;
    }

    async submitVote(pollId: string, studentName: string, optionId: string) {
        const poll = await Poll.findById(pollId);
        if (!poll || !poll.isActive) throw new Error('Poll is not active');

        if (new Date() > poll.endTime!) {
            throw new Error('Poll has ended');
        }

        const vote = new Vote({
            pollId,
            studentName,
            optionId
        });

        return await vote.save();
    }
    async getEnrichedPoll(poll: IPoll): Promise<any> {
        const votes = await Vote.find({ pollId: poll._id });
        const stats = poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            count: votes.filter(v => v.optionId === opt.id).length
        }));

        return {
            ...poll.toObject(),
            totalVotes: votes.length,
            stats
        };
    }
}

export default new PollService();
