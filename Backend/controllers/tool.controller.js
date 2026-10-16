import * as toolService from '../service/tool.service.js';

export const generateSecret = (req, res) => {
    try {
        const { type, length } = req.body || {};
        const secret = toolService.generateSecureSecret({ type, length });
        return res.status(200).json({ secret, type: type || 'hex' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const validateJson = (req, res) => {
    try {
        const { json } = req.body || {};
        if (!json) {
            return res.status(400).json({ error: 'json field is required' });
        }
        const result = toolService.validateAndFormatJson(json);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const getProjectStats = async (req, res) => {
    try {
        const { projectId } = req.params;
        const stats = await toolService.computeProjectStats(projectId);
        return res.status(200).json({ stats });
    } catch (err) {
        return res.status(404).json({ error: err.message });
    }
};
