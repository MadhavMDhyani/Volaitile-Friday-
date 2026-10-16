import mongoose from 'mongoose';
import Message from '../models/message.model.js';

export const getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { after, limit } = req.query;

        const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);

        let messages;
        if (after) {
            if (!mongoose.Types.ObjectId.isValid(after)) {
                return res.status(400).json({ error: 'Invalid message ID in after parameter' });
            }

            messages = await Message.find({
                projectId,
                _id: { $gt: after },
            })
                .sort({ _id: 1 })
                .limit(parsedLimit)
                .populate('sender', 'email _id');
        } else {
            // Default: last 50 ascending
            const recentMessages = await Message.find({ projectId })
                .sort({ _id: -1 })
                .limit(parsedLimit)
                .populate('sender', 'email _id');

            messages = recentMessages.reverse();
        }

        return res.status(200).json({ messages });
    } catch (err) {
        console.error('getMessages error:', err);
        return res.status(500).json({ error: 'Failed to retrieve messages' });
    }
};

export const createMessage = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { text } = req.body;

        if (typeof text !== 'string') {
            return res.status(400).json({ error: 'Message text must be a string' });
        }

        const trimmedText = text.trim();
        if (trimmedText.length < 1 || trimmedText.length > 2000) {
            return res.status(400).json({ error: 'Message text must be between 1 and 2000 characters' });
        }

        const message = await Message.create({
            projectId,
            sender: req.user._id,
            isAi: false,
            text: trimmedText,
        });

        const populated = await Message.findById(message._id).populate('sender', 'email _id');
        return res.status(201).json({ message: populated });
    } catch (err) {
        console.error('createMessage error:', err);
        return res.status(500).json({ error: 'Failed to send message' });
    }
};
