import Project from '../models/project.model.js';
import Message from '../models/message.model.js';

/**
 * Retrieves the 10 most recent messages across all projects
 * that the authenticated user is a collaborator on.
 */
export const getRecentActivity = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Find all projects where the user is a member
        const userProjects = await Project.find({ users: userId }).select('_id name');
        if (!userProjects || userProjects.length === 0) {
            return res.status(200).json({ activity: [] });
        }

        const projectIds = userProjects.map((p) => p._id);

        // Optional limit query parameter (clamped 1-20, defaults to 10)
        const limitParam = parseInt(req.query.limit, 10);
        const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 10;

        const messages = await Message.find({
            projectId: { $in: projectIds },
        })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .populate('sender', 'email _id')
            .populate('projectId', 'name _id');

        const activity = messages.map((m) => {
            const projectRef = m.projectId;
            return {
                _id: m._id,
                text: m.text,
                isAi: m.isAi,
                createdAt: m.createdAt,
                sender: m.sender ? { _id: m.sender._id, email: m.sender.email } : null,
                project: {
                    _id: projectRef?._id || projectRef,
                    name: projectRef?.name || 'Project Workspace',
                },
            };
        });

        return res.status(200).json({ activity });
    } catch (err) {
        console.error('getRecentActivity error:', err);
        return res.status(500).json({ error: 'Failed to retrieve dashboard activity' });
    }
};

export default {
    getRecentActivity,
};
