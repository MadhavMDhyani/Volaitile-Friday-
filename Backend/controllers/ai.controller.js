import { validationResult } from 'express-validator';
import * as aiService from '../service/ai.service.js';
import projectModel from '../models/project.model.js';

export const handleAiChat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { message, projectId } = req.body;
        let projectName = 'Volaitile Friday';
        let projectContext = null;

        if (projectId) {
            const project = await projectModel.findById(projectId).select('name users');
            if (project) {
                projectName = project.name;
                projectContext = {
                    projectName: project.name,
                    collaboratorCount: project.users?.length || 1,
                };
            }
        }

        const reply = await aiService.generateAiChat({
            message,
            projectName,
            context: projectContext,
        });

        return res.status(200).json({
            reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'Friday AI',
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return res.status(500).json({ error: 'Failed to process AI response' });
    }
};

export const handleGenerateCode = async (req, res) => {
    try {
        const { prompt, language, framework } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const code = await aiService.generateCodeSnippet({
            prompt,
            language: language || 'javascript',
            framework: framework || 'express',
        });

        return res.status(200).json({ code });
    } catch (error) {
        console.error('AI generate code error:', error);
        return res.status(500).json({ error: 'Failed to generate code' });
    }
};

export const handleReviewCode = async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Code content is required' });
        }

        const review = await aiService.reviewCodeSnippet({
            code,
            language: language || 'javascript',
        });

        return res.status(200).json({ review });
    } catch (error) {
        console.error('AI review code error:', error);
        return res.status(500).json({ error: 'Failed to review code' });
    }
};
