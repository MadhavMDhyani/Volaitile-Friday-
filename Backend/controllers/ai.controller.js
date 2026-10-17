import { validationResult } from 'express-validator';
import * as aiService from '../service/ai.service.js';
import Message from '../models/message.model.js';
import { AI_MODELS, getDefaultModelId } from '../config/aiModels.js';
import { getIO } from '../service/socket.service.js';

export const handleAiChat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { message, model } = req.body;
        let projectName = 'Volaitile Friday';
        let projectContext = null;

        if (req.project) {
            projectName = req.project.name;
            projectContext = {
                projectName: req.project.name,
                collaboratorCount: req.project.users?.length || 1,
            };
        }

        const { reply, source, model: answeringModel, requestedModel, latencyMs } =
            await aiService.generateAiChat({
                message,
                projectName,
                context: projectContext,
                model,
            });

        let savedMessage = null;
        if (req.project) {
            try {
                savedMessage = await Message.create({
                    projectId: req.project._id,
                    sender: null,
                    isAi: true,
                    text: reply,
                    model: answeringModel,
                    source,
                    requestedModel,
                    latencyMs,
                });

                // Broadcast to project room so all active collaborators see Friday's response
                try {
                    const io = getIO();
                    if (io) {
                        io.to(`project:${req.project._id}`).emit('chat:message', savedMessage);
                    }
                } catch (broadcastErr) {
                    console.warn('Socket broadcast warning:', broadcastErr?.message);
                }
            } catch (saveErr) {
                console.warn('Could not save AI reply as message:', saveErr.message);
            }
        }

        const responsePayload = {
            reply,
            source,
            model: answeringModel,
            requestedModel,
            latencyMs,
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
        const { prompt, language, framework, model } = req.body;

        const { code, source, model: answeringModel, requestedModel, latencyMs } =
            await aiService.generateCodeSnippet({
                prompt,
                language: language || 'javascript',
                framework: framework || 'express',
                model,
            });

        return res.status(200).json({
            code,
            source,
            model: answeringModel,
            requestedModel,
            latencyMs,
        });
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
        const { code, language, model } = req.body;

        const { review, source, model: answeringModel, requestedModel, latencyMs } =
            await aiService.reviewCodeSnippet({
                code,
                language: language || 'javascript',
                model,
            });

        return res.status(200).json({
            review,
            source,
            model: answeringModel,
            requestedModel,
            latencyMs,
        });
    } catch (error) {
        console.error('AI review code error:', error);
        return res.status(500).json({ error: 'Failed to review code' });
    }
};

export const handleGetAiModels = (req, res) => {
    try {
        const defaultModelId = getDefaultModelId();
        const models = AI_MODELS.map((m) => ({
            id: m.id,
            label: m.label,
            speed: m.speed,
            maxOutputTokens: m.maxOutputTokens,
            temperature: m.temperature,
            supportsStreaming: m.supportsStreaming,
            isDefault: m.id === defaultModelId,
        }));

        return res.status(200).json({
            models,
            defaultModel: defaultModelId,
        });
    } catch (error) {
        console.error('AI get models error:', error);
        return res.status(500).json({ error: 'Failed to retrieve AI models' });
    }
};

export default {
    handleAiChat,
    handleGenerateCode,
    handleReviewCode,
    handleGetAiModels,
};
