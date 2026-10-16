import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        unique: [true, 'Project name must be unique'],
    },
   

    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ]

})



const Project = mongoose.models.Project || mongoose.models.project || mongoose.model('Project', projectSchema);
if (!mongoose.models.project) {
    mongoose.model('project', projectSchema);
}

export default Project;