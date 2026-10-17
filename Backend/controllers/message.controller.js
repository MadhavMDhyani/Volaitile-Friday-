import mongoose from 'mongoose';
import Message from '../models/message.model.js';

import { saveAndBroadcastMessage } from '../service/message.service.js';

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
        const text = req.body.text ?? req.body.content;

        const senderId = req.user?._id || req.user?.id;
        const populated = await saveAndBroadcastMessage({
            projectId,
            senderId,
            text,
        });

        return res.status(201).json({ message: populated });
    } catch (err) {
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        console.error('createMessage error:', err);
        return res.status(500).json({ error: 'Failed to send message' });
    }
};
