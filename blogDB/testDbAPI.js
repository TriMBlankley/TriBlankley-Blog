import express from 'express';
import mongoose from 'mongoose';
import { blogPost } from './blogPostSchema.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

//this is what actualy makes the connection to the mongodb server
mongoose
  .connect('mongodb://127.0.0.1:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.get('/api/blogPost', async (req, res) => {
  // when you make a call to /api/blogPost from the browser, it will run this 'function'
  try {
    const blogPosts = await blogPost.find();
    res.json(blogPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function doSomething() {
  let posts = await blogPost
    .find({ postId: { $gt: 3 } })
    .limit(10)
    .exec();
  return posts;
}

async function addPost() {
  let currentDate = Date.now();

  let new_post = new blogPost({
    postId: 5,
    postDate: currentDate,
  });
  await new_post.save();
}

app.get('/posts', async (req, res) => {
  res.json({ ok: true });
});

app.post('/posts', async (req, res) => {
  await addPost();
  res.json({ body: req.body });
});

app.post('/respond', async (req, res) => {
  res.json({ body: req.body });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
