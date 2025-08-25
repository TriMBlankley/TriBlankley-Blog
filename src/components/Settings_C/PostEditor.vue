<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownEditor from './MarkdownEditor.vue'

const router = useRouter()
const posts = ref<Post[]>([])

interface Post {
  postId: number
  postTitle: string
  postAuthor: string
  postDate: string
  postContent: string
  postTopics: string[]
  isPublished: boolean
}

const currentPost = ref<Post>({
  postId: 0,
  postTitle: '',
  postAuthor: '',
  postDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }),
  postContent: '',
  postTopics: [],
  isPublished: false
})


// Dropdown specific state and methods
const isDropdownOpen = ref(false);
const topicSearch = ref('');
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const filteredAvailableTopics = computed(() => {
  return availableTopics.value.filter(topic =>
    topic.toLowerCase().includes(topicSearch.value.toLowerCase())
  );
});

const filteredPosts = computed(() => {
  if (postFilter.value === 'published') {
    return posts.value.filter(post => post.isPublished);
  } else if (postFilter.value === 'drafts') {
    return posts.value.filter(post => !post.isPublished);
  }
  return posts.value;
});
const toggleTopic = (topic: string) => {
  const topics = currentPost.value.postTopics;
  if (topics.includes(topic)) {
    currentPost.value.postTopics = topics.filter(t => t !== topic);
  } else {
    currentPost.value.postTopics = [...topics, topic];
  }
};

const addNewTopic = () => {
  const newTopic = prompt("Enter new topic name:");
  if (newTopic) {
    if (!availableTopics.value.includes(newTopic)) {
      availableTopics.value.push(newTopic);
      currentPost.value.postTopics.push(newTopic);
    } else {
      alert("Topic already exists!");
    }
  }
};

const removeTopic = (topic: string) => {
  currentPost.value.postTopics = currentPost.value.postTopics.filter(t => t !== topic);
};
const filter = ref<'all' | 'published' | 'drafts'>('all');


const availableTopics = ref<string[]>([]);
const isEditing = ref(false);
const postFilter = ref<'all' | 'published' | 'drafts'>('all');

// Fetch data
const fetchData = async () => {
  try {
    const [postsResponse, topicsResponse] = await Promise.all([
      fetch('http://localhost:8050/api/posts'),
      fetch('http://localhost:8050/api/topics')
    ]);

    if (!postsResponse.ok) throw new Error('Failed to fetch posts');
    if (!topicsResponse.ok) throw new Error('Failed to fetch topics');

    posts.value = await postsResponse.json();
    const topicsData = await topicsResponse.json();
    availableTopics.value = topicsData.map((topic: any) => topic.topicName);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Reset form function
const resetForm = () => {
  currentPost.value = {
    postId: 0,
    postTitle: '',
    postAuthor: '',
    postDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    postContent: '',
    postTopics: [],
    isPublished: false
  };
  isEditing.value = false;
};

const publishing = ref(false);

const publishPost = async (post?: Post) => {
  if (post && !confirm(`Publish "${post.postTitle}"?`)) return;

  publishing.value = true;
  try {
    if (post) {
      currentPost.value = { ...post, isPublished: true };
    } else if (!currentPost.value.postTitle || !currentPost.value.postContent) {
      alert('Please fill in required fields before publishing');
      return;
    }

    await savePost(true);
    alert('Post published successfully!');
  } catch (error) {
    console.error('Error publishing post:', error);
    alert('Failed to publish post');
  } finally {
    publishing.value = false;
  }
};

// Edit post
const editPost = (post: Post) => {
  currentPost.value = { ...post };
  isEditing.value = true;
};

// Delete post
const deletePost = async (postId: number) => {
  try {
    const response = await fetch(`http://localhost:8050/api/posts/${postId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete post');
    await fetchData();
  } catch (error) {
    console.error('Error deleting post:', error);
  }
};



const savePost = async (publish: boolean = false) => {
  try {
    const postToSave = {
      ...currentPost.value,
      isPublished: publish || currentPost.value.isPublished,
      postDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    // Convert images to base64 if needed
    if (postToSave.postContent.includes('<img src="data:')) {
      // Handle base64 images (already properly formatted)
    }

    const method = isEditing.value ? 'PUT' : 'POST'
    const url = isEditing.value
      ? `http://localhost:8050/api/posts/${currentPost.value.postId}`
      : 'http://localhost:8050/api/posts'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postToSave)
    })

    if (!response.ok) throw new Error('Failed to save post')

    await fetchData()
    if (publish) {
      router.push('/')
    } else {
      resetForm()
    }
  } catch (error) {
    console.error('Error saving post:', error)
    alert('Failed to save post. Please try again.')
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="post-editor">
    <div class="editor-container">
      <h2>{{ isEditing ? 'Edit Post' : 'Create New Post' }}</h2>

      <div class="post-form">
        <div class="form-group">
          <label for="postTitle">Post Title *</label>
          <input
            id="postTitle"
            v-model="currentPost.postTitle"
            type="text"
            placeholder="Enter post title"
            required
          >
        </div>

        <div class="form-group">
          <label for="postAuthor">Author *</label>
          <input
            id="postAuthor"
            v-model="currentPost.postAuthor"
            type="text"
            placeholder="Enter author name"
            required
          >
        </div>

        <div class="form-group">
          <label>Topics</label>
          <div class="topics-dropdown" ref="dropdownRef">
            <button
              class="dropdown-toggle"
              @click.stop="toggleDropdown"
            >
              Select Topics ▼
            </button>
            <div class="dropdown-menu" v-if="isDropdownOpen">
              <div class="dropdown-search">
                <input
                  type="text"
                  v-model="topicSearch"
                  placeholder="Search topics..."
                  @click.stop
                >
                <button @click.stop="addNewTopic" class="add-topic-btn">
                  + New Topic
                </button>
              </div>
              <div class="dropdown-items">
                <div
                  v-for="topic in filteredAvailableTopics"
                  :key="topic"
                  class="dropdown-item"
                  @click.stop="toggleTopic(topic)"
                >
                  <input
                    type="checkbox"
                    :checked="currentPost.postTopics.includes(topic)"
                    @click.stop
                  >
                  <span>{{ topic }}</span>
                </div>
              </div>
            </div>
            <div class="selected-topics">
              <span
                v-for="topic in currentPost.postTopics"
                :key="'selected-' + topic"
                class="selected-topic"
              >
                {{ topic }}
                <span
                  class="remove-topic"
                  @click.stop="removeTopic(topic)"
                >
                  ×
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="postContent">Content *</label>
          <MarkdownEditor v-model="currentPost.postContent" />
        </div>

        <div class="form-actions">
          <button @click="() => savePost(false)" class="save-btn">
            {{ isEditing ? 'Update' : 'Save Draft' }}
          </button>
          <button @click="publishPost()" class="publish-btn">
            {{ isEditing && currentPost.isPublished ? 'Update Published' : 'Publish' }}
          </button>
          <button @click="resetForm" class="cancel-btn">
            Cancel
          </button>
        </div>
      </div>

      <div class="posts-list" v-if="posts.length > 0">
        <h3>Existing Posts</h3>
        <div class="post-filters">
          <button @click="filter = 'all'" :class="{ active: filter === 'all' }">All</button>
          <button @click="filter = 'published'" :class="{ active: filter === 'published' }">Published</button>
          <button @click="filter = 'drafts'" :class="{ active: filter === 'drafts' }">Drafts</button>
        </div>
        <ul class="posts-container">
          <li v-for="post in filteredPosts" :key="post.postId" class="post-item">
            <div class="post-info">
              <h4>{{ post.postTitle }}</h4>
              <div class="post-meta">
                <span>By {{ post.postAuthor }}</span>
                <span>{{ post.postDate }}</span>
                <span class="status-badge" :class="{ published: post.isPublished }">
                  {{ post.isPublished ? 'Published' : 'Draft' }}
                </span>
              </div>
              <div class="post-topics" v-if="post.postTopics.length > 0">
                <span v-for="topic in post.postTopics" :key="topic" class="topic-tag">
                  {{ topic }}
                </span>
              </div>
            </div>
            <div class="post-actions">
              <button @click="editPost(post)" class="edit-btn">Edit</button>
              <button @click="deletePost(post.postId)" class="delete-btn">Delete</button>
              <button
                v-if="!post.isPublished"
                @click="publishPost(post)"
                class="publish-btn"
              >
                Publish
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-container {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  background: var(--background);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
}

.topics-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.topic-option {
  padding: 0.25rem 0.5rem;
  background: var(--background-alt);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.topic-option:hover {
  background: var(--hover);
}

.topic-option.selected {
  background: var(--accent);
  color: white;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.save-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background-color: var(--accent-light);
  color: var(--accent);
}



.cancel-btn {
  background-color: var(--background);
  border: 1px solid var(--border);
}

.posts-list {
  margin-top: 2rem;
}

.post-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.post-filters button {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.post-filters button.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.posts-container {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--background-alt);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.post-info {
  flex: 1;
}

.post-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-offset);
  margin: 0.5rem 0;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background-color: var(--warning-light);
  color: var(--warning);
}

.status-badge.published {
  background-color: var(--success-light);
  color: var(--success);
}

.post-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.topic-tag {
  padding: 0.25rem 0.5rem;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 4px;
  font-size: 0.75rem;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn,
.delete-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.edit-btn {
  background-color: var(--accent-light);
  color: var(--accent);
}

.delete-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.topics-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-toggle {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: white;
  text-align: left;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 0.25rem;
}

.dropdown-search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 0.5rem;
}

.dropdown-search input {
  flex: 1;
  padding: 0.25rem;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.add-topic-btn {
  padding: 0.25rem 0.5rem;
  background: var(--accent-light);
  color: var(--accent);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dropdown-items {
  padding: 0.5rem;
}

.dropdown-item {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--hover);
}

.dropdown-item input {
  cursor: pointer;
}

.selected-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.selected-topic {
  background: var(--accent-light);
  color: var(--accent);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.remove-topic {
  cursor: pointer;
  font-size: 1.1em;
  line-height: 1;
}

.remove-topic:hover {
  color: var(--error);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.save-btn,
.publish-btn,
.cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.publish-btn {
  background-color: var(--success);
  color: white;
}
</style>
