import 'dotenv/config';
import mongoose from 'mongoose';
import Project from '../models/project.model.js';

async function runMigration() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('Fatal Error: MONGODB_URI is required to run the migration.');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB.');

        // Step 1: Drop old unique index 'name_1' if it exists
        try {
            const collection = Project.collection;
            const indexes = await collection.indexes();
            const hasNameIndex = indexes.some((idx) => idx.name === 'name_1');
            if (hasNameIndex) {
                await collection.dropIndex('name_1');
                console.log('Successfully dropped legacy index "name_1".');
            } else {
                console.log('Legacy index "name_1" not present. Skipped.');
            }
        } catch (idxErr) {
            console.log('Notice: Could not drop "name_1" (may already be dropped):', idxErr.message);
        }

        // Step 2: Set owner = users[0] for every project without an owner
        const projectsWithoutOwner = await Project.find({
            $or: [{ owner: { $exists: false } }, { owner: null }],
        });

        console.log(`Found ${projectsWithoutOwner.length} project(s) without an owner.`);

        let updatedCount = 0;
        for (const project of projectsWithoutOwner) {
            if (project.users && project.users.length > 0) {
                project.owner = project.users[0];
                await project.save();
                updatedCount++;
                console.log(`Assigned owner ${project.owner} to project "${project.name}" (${project._id})`);
            } else {
                console.warn(`Project "${project.name}" (${project._id}) has no users. Owner could not be assigned.`);
            }
        }

        console.log(`Updated ${updatedCount} project(s) with owner.`);

        // Step 3: Sync indexes to apply { owner: 1, name: 1 } unique index
        console.log('Syncing Project indexes...');
        await Project.syncIndexes();
        console.log('Project indexes successfully synced.');

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed with error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

runMigration();
