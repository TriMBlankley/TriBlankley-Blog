import express from 'express';
import cors from 'cors';

const app = express();
const port = 8050;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory storage for topics (replace with database in production)
let topics = [];

// Get all topics
app.get('/api/topics', (req, res) => {
    res.json(topics);
});

// Save all topics
app.post('/api/topics', (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Expected an array of topics' });
    }
    topics = req.body;
    res.json({ message: 'Topics saved successfully' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});