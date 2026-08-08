import projectModel from '../models/project.model.js';


export const createProject = async ({
    name, userId
}) => {
    


    if (!name) {
        throw new Error('Name is required');
    }
    if (!userId) {
        throw new Error('User is required');
    }

    let project;
    try {
        project = await projectModel.create({
            name,
            users: [userId]
        });
    } catch (err) {
        // Handle duplicate key error from mongoose (code 11000)
        if (err && (err.code === 11000 || err.codeName === 'DuplicateKey')) {
            throw new Error('Project name already exists');
        }
        throw err;
    }

    return project;
}