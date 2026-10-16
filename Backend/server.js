import 'dotenv/config';
import http from 'http';
import app from './app.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('Fatal Error: JWT_SECRET environment variable is missing or shorter than 32 characters.');
    process.exit(1);
}

const port = process.env.PORT || 3000;

const server = http.createServer(app);


server.listen(port, () => {   
console.log(`Server is running on port ${port}`);
})