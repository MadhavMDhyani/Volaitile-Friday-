import mongoose from 'mongoose';

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
});

function connect() {
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('Fatal Error: MONGODB_URI is not set in environment.');
        process.exit(1);
    }

    mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    }).then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
}

export default connect;