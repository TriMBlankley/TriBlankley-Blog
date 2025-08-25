import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Topic Schema
const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  topicColor: { type: String, required: true },
  topicOrder: { type: Number, required: true },
});

// Define Post Schema
const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  postTitle: { type: String, required: true },
  postAuthor: { type: String, required: true },
  postDate: { type: String, required: true },
  postContent: { type: String, required: true },
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false }
});

const Topic = mongoose.model('Topic', topicSchema);
const Post = mongoose.model('Post', postSchema);

// Topics API
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ topicOrder: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    await Topic.deleteMany({});
    const newTopics = await Topic.insertMany(req.body);
    res.json(newTopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Posts API
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    // Generate a new postId by finding the highest existing one and adding 1
    const highestPost = await Post.findOne().sort('-postId');
    const newPostId = highestPost ? highestPost.postId + 1 : 1;

    const newPost = new Post({
      ...req.body,
      postId: newPostId,
      postDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findOneAndUpdate(
      { postId: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findOneAndDelete({ postId: req.params.id });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(8050, () => {
  console.log('Server running on http://localhost:8050');
});

// POST endpoint - Save Markdown as-is
app.post('/api/posts', async (req, res) => {
  try {
    const highestPost = await Post.findOne().sort('-postId');
    const newPostId = highestPost ? highestPost.postId + 1 : 1;

    const newPost = new Post({
      ...req.body,
      postId: newPostId,
      postDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      contentType: 'markdown' // Ensure content type is set
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET endpoint - Return raw Markdown
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ postId: req.params.id });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post); // Returns Markdown in postContent
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
