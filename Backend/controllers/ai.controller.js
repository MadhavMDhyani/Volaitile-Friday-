import { validationResult } from 'express-validator';
import * as aiService from '../service/ai.service.js';
import Message from '../models/message.model.js';

export const handleAiChat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { message } = req.body;
        let projectName = 'Volaitile Friday';
        let projectContext = null;

        if (req.project) {
            projectName = req.project.name;
            projectContext = {
                projectName: req.project.name,
                collaboratorCount: req.project.users?.length || 1,
            };
        }

        const { reply, source } = await aiService.generateAiChat({
            message,
            projectName,
            context: projectContext,
        });

        let savedMessage = null;
        if (req.project) {
            try {
                savedMessage = await Message.create({
                    projectId: req.project._id,
                    sender: null,
                    isAi: true,
                    text: reply,
                });
            } catch (saveErr) {
                console.warn('Could not save AI reply as message:', saveErr.message);
            }
        }

        const responsePayload = {
            reply,
            source,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'Friday AI',
        };

        if (savedMessage) {
            responsePayload.message = savedMessage;
        }

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('AI chat error:', error);
        return res.status(500).json({ error: 'Failed to process AI response' });
    }
};

export const handleGenerateCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { prompt, language, framework } = req.body;

        const { code, source } = await aiService.generateCodeSnippet({
            prompt,
            language: language || 'javascript',
            framework: framework || 'express',
        });

        return res.status(200).json({ code, source });
    } catch (error) {
        console.error('AI generate code error:', error);
        return res.status(500).json({ error: 'Failed to generate code' });
    }
};

export const handleReviewCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { code, language } = req.body;

        const { review, source } = await aiService.reviewCodeSnippet({
            code,
            language: language || 'javascript',
        });

        return res.status(200).json({ review, source });
    } catch (error) {
        console.error('AI review code error:', error);
        return res.status(500).json({ error: 'Failed to review code' });
    }
};
