<!-- [file name]: PostEditor.vue -->
<template>
  <div class="post-editor">
    <div class="editor-header">
      <h1>Manage Blog Posts</h1>
      <div class="header-controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
        <select v-model="filterStatus" class="status-filter">
          <option value="all">All Posts</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading posts...</p>
    </div>

    <!-- Posts List -->
    <div v-else class="posts-list">
      <div v-if="filteredPosts.length === 0" class="empty-state">
        <p v-if="searchQuery || filterStatus !== 'all'">No posts match your criteria.</p>
        <p v-else>No posts found. Create your first blog post!</p>
      </div>

      <div
        v-for="post in filteredPosts"
        :key="post.postId"
        class="post-card"
        :class="{ 'published': post.isPublished, 'draft': !post.isPublished }"
      >
        <div class="post-header">
          <h3 class="post-title">{{ post.postTitle }}</h3>
          <div class="post-meta">
            <span class="post-author">By {{ post.postAuthor }}</span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            <span class="post-status" :class="post.isPublished ? 'published' : 'draft'">
              {{ post.isPublished ? 'Published' : 'Draft' }}
            </span>
          </div>
        </div>

        <div class="post-content-preview">
          {{ truncateContent(post.postContent) }}
        </div>

        <div class="post-topics">
          <span
            v-for="topic in post.postTopics"
            :key="topic"
            class="topic-tag"
            :style="getTopicStyle(topic)"
          >
            {{ topic }}
          </span>
        </div>

        <div class="post-actions">
          <button
            @click="editPost(post)"
            class="btn btn-edit"
            title="Edit post"
          >
            ✏️ Edit
          </button>

          <button
            v-if="post.isPublished"
            @click="togglePublishStatus(post)"
            class="btn btn-unpublish"
            title="Unpublish post"
          >
            👁️ Unpublish
          </button>

          <button
            v-else
            @click="togglePublishStatus(post)"
            class="btn btn-publish"
            title="Publish post"
          >
            📢 Publish
          </button>

          <button
            @click="deletePost(post)"
            class="btn btn-delete"
            title="Delete post"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Post Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h2>Edit Blog Post</h2>
          <button @click="closeEditModal" class="close-btn">×</button>
        </div>

        <form @submit.prevent="updatePost" class="edit-form">
          <div class="form-group">
            <label for="editTitle">Post Title *</label>
            <input
              id="editTitle"
              v-model="editingPost.postTitle"
              type="text"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="editAuthor">Author *</label>
            <input
              id="editAuthor"
              v-model="editingPost.postAuthor"
              type="text"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="editContent">Content *</label>
            <textarea
              id="editContent"
              v-model="editingPost.postContent"
              required
              rows="10"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Topics</label>
            <div class="topics-selection">
              <div
                v-for="topic in availableTopics"
                :key="topic.topicName"
                class="topic-tag"
                :class="{ 'selected': editingPost.postTopics.includes(topic.topicName) }"
                @click="toggleEditTopic(topic.topicName)"
                :style="{ backgroundColor: topic.topicColor + '20', borderColor: topic.topicColor }"
              >
                {{ topic.topicName }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input
                id="editPublished"
                v-model="editingPost.isPublished"
                type="checkbox"
              >
              <label for="editPublished" class="checkbox-label">
                Publish this post
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closeEditModal"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isEditFormValid || isSubmitting"
              class="btn btn-primary"
            >
              <span v-if="isSubmitting">Updating...</span>
              <span v-else>Update Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay">
      <div class="modal-content confirm-modal">
        <h2>{{ confirmAction.title }}</h2>
        <p>{{ confirmAction.message }}</p>
        <div class="modal-actions">
          <button @click="cancelAction" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmAction.action" class="btn btn-danger">
            {{ confirmAction.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostEditor',

  data() {
    return {
      posts: [],
      availableTopics: [],
      loading: false,
      searchQuery: '',
      filterStatus: 'all',
      showEditModal: false,
      showConfirmModal: false,
      isSubmitting: false,
      editingPost: null,
      confirmAction: {
        title: '',
        message: '',
        confirmText: '',
        action: null
      }
    };
  },

  computed: {
    filteredPosts() {
      let filtered = this.posts;

      // Filter by status
      if (this.filterStatus !== 'all') {
        filtered = filtered.filter(post =>
          this.filterStatus === 'published' ? post.isPublished : !post.isPublished
        );
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(post =>
          post.postTitle.toLowerCase().includes(query) ||
          post.postAuthor.toLowerCase().includes(query) ||
          post.postContent.toLowerCase().includes(query) ||
          post.postTopics.some(topic => topic.toLowerCase().includes(query))
        );
      }

      // Sort by creation date (newest first)
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    isEditFormValid() {
      return (
        this.editingPost &&
        this.editingPost.postTitle.trim() &&
        this.editingPost.postAuthor.trim() &&
        this.editingPost.postContent.trim()
      );
    }
  },

  async mounted() {
    await this.loadPosts();
    await this.loadTopics();
  },

  methods: {
    async loadPosts() {
      this.loading = true;
      try {
        const response = await fetch('/api/posts');
        if (response.ok) {
          this.posts = await response.json();
        } else {
          throw new Error('Failed to load posts');
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        alert('Failed to load posts. Please check your connection.');
      } finally {
        this.loading = false;
      }
    },

    async loadTopics() {
      try {
        const response = await fetch('/api/topics');
        if (response.ok) {
          this.availableTopics = await response.json();
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    },

    editPost(post) {
      this.editingPost = { ...post };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editingPost = null;
    },

    toggleEditTopic(topicName) {
      const index = this.editingPost.postTopics.indexOf(topicName);
      if (index > -1) {
        this.editingPost.postTopics.splice(index, 1);
      } else {
        this.editingPost.postTopics.push(topicName);
      }
    },

    async updatePost() {
      if (!this.isEditFormValid) return;

      this.isSubmitting = true;
      try {
        const response = await fetch(`/api/posts/${this.editingPost.postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.editingPost)
        });

        if (!response.ok) {
          throw new Error('Failed to update post');
        }

        const updatedPost = await response.json();

        // Update the posts list
        const index = this.posts.findIndex(p => p.postId === updatedPost.postId);
        if (index > -1) {
          this.posts.splice(index, 1, updatedPost);
        }

        this.showEditModal = false;
        this.editingPost = null;

        alert('Post updated successfully!');
      } catch (error) {
        console.error('Error updating post:', error);
        alert(`Failed to update post: ${error.message}`);
      } finally {
        this.isSubmitting = false;
      }
    },

    togglePublishStatus(post) {
      this.confirmAction = {
        title: post.isPublished ? 'Unpublish Post' : 'Publish Post',
        message: post.isPublished
          ? `Are you sure you want to unpublish "${post.postTitle}"? It will no longer be visible to readers.`
          : `Are you sure you want to publish "${post.postTitle}"? It will become visible to readers.`,
        confirmText: post.isPublished ? 'Unpublish' : 'Publish',
        action: () => this.confirmTogglePublish(post)
      };
      this.showConfirmModal = true;
    },

    async confirmTogglePublish(post) {
      try {
        const updatedPost = { ...post, isPublished: !post.isPublished };

        const response = await fetch(`/api/posts/${post.postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPost)
        });

        if (!response.ok) {
          throw new Error('Failed to update post status');
        }

        const result = await response.json();

        // Update the posts list
        const index = this.posts.findIndex(p => p.postId === result.postId);
        if (index > -1) {
          this.posts.splice(index, 1, result);
        }

        this.showConfirmModal = false;

        alert(`Post ${result.isPublished ? 'published' : 'unpublished'} successfully!`);
      } catch (error) {
        console.error('Error updating post status:', error);
        alert(`Failed to update post status: ${error.message}`);
      }
    },

    deletePost(post) {
      this.confirmAction = {
        title: 'Delete Post',
        message: `Are you sure you want to delete "${post.postTitle}"? This action cannot be undone.`,
        confirmText: 'Delete',
        action: () => this.confirmDelete(post)
      };
      this.showConfirmModal = true;
    },

    async confirmDelete(post) {
      try {
        const response = await fetch(`/api/posts/${post.postId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete post');
        }

        // Remove from posts list
        this.posts = this.posts.filter(p => p.postId !== post.postId);
        this.showConfirmModal = false;

        alert('Post deleted successfully!');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.message}`);
      }
    },

    cancelAction() {
      this.showConfirmModal = false;
      this.confirmAction = {
        title: '',
        message: '',
        confirmText: '',
        action: null
      };
    },

    truncateContent(content, length = 150) {
      if (!content) return '';
      return content.length > length
        ? content.substring(0, length) + '...'
        : content;
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown date';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    getTopicStyle(topicName) {
      const topic = this.availableTopics.find(t => t.topicName === topicName);
      if (topic) {
        return {
          backgroundColor: topic.topicColor + '20',
          borderColor: topic.topicColor
        };
      }
      return {};
    }
  }
};
</script>

<style scoped>
.post-editor {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.editor-header h1 {
  color: #333;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
}

.search-icon {
  position: absolute;
  right: 12px;
  color: #6b7280;
}

.status-filter {
  padding: 10px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  font-size: 16px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #6b7280;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.post-card.published {
  border-left-color: #10b981;
}

.post-card.draft {
  border-left-color: #f59e0b;
}

.post-header {
  margin-bottom: 16px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.post-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 14px;
  color: #6b7280;
}

.post-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.post-status.published {
  background: #10b98120;
  color: #059669;
}

.post-status.draft {
  background: #f59e0b20;
  color: #d97706;
}

.post-content-preview {
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 16px;
}

.post-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.topic-tag {
  padding: 4px 12px;
  border: 1px solid;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: default;
}

.post-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit {
  background: #3b82f6;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-publish {
  background: #10b981;
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background: #059669;
}

.btn-unpublish {
  background: #f59e0b;
  color: white;
}

.btn-unpublish:hover:not(:disabled) {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

.edit-modal {
  width: 600px;
  max-width: 90%;
}

.confirm-modal {
  width: 400px;
  max-width: 90%;
  padding: 32px;
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.edit-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #555;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-label {
  margin-bottom: 0;
  font-weight: normal;
  cursor: pointer;
}

.topics-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.topic-tag.selected {
  background-color: inherit !important;
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-controls {
    justify-content: space-between;
  }

  .search-input {
    width: 200px;
  }

  .post-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
