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
            <span class="post-content-type">{{ post.contentType }}</span>
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

        <div v-if="post.postGroup" class="post-group">
          <span
            class="group-tag"
            :style="{
              backgroundColor: post.postGroup.groupColor + '20',
              borderColor: post.postGroup.groupColor,
              color: post.postGroup.groupColor
            }"
          >
            {{ post.postGroup.groupName }}
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

    <!-- Edit Post Modal - Full Featured -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content edit-modal">
        <div class="modal-header">
          <h2>Edit Blog Post</h2>
          <button @click="closeEditModal" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <!-- Loading Overlay -->
          <div v-if="isSubmitting" class="loading-overlay">
            <div class="loading-content">
              <div class="spinner"></div>
              <h3>Updating Post...</h3>
              <p>Please wait while we process your content and files</p>
              <div class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <span>{{ uploadProgress }}% Complete</span>
              </div>
              <div class="current-task">{{ currentTask }}</div>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="errorMessage" class="error-alert">
            <div class="error-content">
              <h3>❌ Error</h3>
              <p>{{ errorMessage }}</p>
              <button @click="clearError" class="btn btn-secondary">Dismiss</button>
            </div>
          </div>

          <form @submit.prevent="updatePost" class="edit-form">
            <!-- Basic Post Information -->
            <div class="form-section">
              <h2>Post Information</h2>

              <div class="form-group">
                <label for="editTitle">Post Title *</label>
                <input
                  id="editTitle"
                  v-model="editingPost.postTitle"
                  type="text"
                  required
                  placeholder="Enter post title"
                  class="form-input"
                  :class="{ 'error': fieldErrors.postTitle }"
                >
                <span v-if="fieldErrors.postTitle" class="error-text">{{ fieldErrors.postTitle }}</span>
              </div>

              <div class="form-group">
                <label for="editAuthor">Author *</label>
                <input
                  id="editAuthor"
                  v-model="editingPost.postAuthor"
                  type="text"
                  required
                  placeholder="Enter author name"
                  class="form-input"
                  :class="{ 'error': fieldErrors.postAuthor }"
                >
                <span v-if="fieldErrors.postAuthor" class="error-text">{{ fieldErrors.postAuthor }}</span>
              </div>

              <!-- Content Type Selection -->
              <div class="form-group">
                <label for="editContentType">Content Type *</label>
                <select
                  id="editContentType"
                  v-model="editingPost.contentType"
                  class="form-input"
                  :class="{ 'error': fieldErrors.contentType }"
                  required
                >
                  <option value="">Select content type...</option>
                  <option value="Text">Text</option>
                  <option value="Code">Code</option>
                  <option value="File">File</option>
                  <option value="Video">Video</option>
                  <option value="Music">Music</option>
                  <option value="None">None</option>
                </select>
                <span v-if="fieldErrors.contentType" class="error-text">{{ fieldErrors.contentType }}</span>
              </div>

              <div class="form-group">
                <label for="editPublished">Publish Status</label>
                <div class="checkbox-group">
                  <input
                    id="editPublished"
                    v-model="editingPost.isPublished"
                    type="checkbox"
                  >
                  <label for="editPublished" class="checkbox-label">
                    Publish immediately
                  </label>
                </div>
              </div>
            </div>

            <!-- Post Topic Selection -->
            <div class="form-section">
              <h2>Post Topic *</h2>
              <div class="form-group">
                <label>Select Post Topic</label>
                <select
                  v-model="editingPost.postTopics[0]"
                  class="form-input"
                  :class="{ 'error': fieldErrors.postTopics }"
                  required
                >
                  <option value="">Select a topic...</option>
                  <option v-for="topic in availableTopics" :key="topic.topicName" :value="topic.topicName">
                    {{ topic.topicName }}
                  </option>
                </select>
                <span v-if="fieldErrors.postTopics" class="error-text">{{ fieldErrors.postTopics }}</span>
              </div>

              <div v-if="editingPost.postTopics[0]" class="selected-topic-display">
                <span class="topic-tag" :style="{
                  backgroundColor: getTopicColor(editingPost.postTopics[0]) + '20',
                  borderColor: getTopicColor(editingPost.postTopics[0])
                }">
                  {{ editingPost.postTopics[0] }}
                </span>
              </div>
            </div>

            <!-- Post Group Selection -->
            <div class="form-section">
              <h2>Post Group (Optional)</h2>
              <div class="form-group">
                <label>Assign to Post Group</label>
                <div class="group-selection">
                  <select v-model="editingPost.postGroupId" class="form-input">
                    <option value="">No Group</option>
                    <option
                      v-for="group in availableGroups"
                      :key="group._id"
                      :value="group._id"
                      :style="{ color: group.groupColor }"
                    >
                      {{ group.groupName }}
                    </option>
                  </select>
                  <button
                    type="button"
                    @click="showCreateGroup = true"
                    class="btn btn-outline"
                  >
                    + Create New Group
                  </button>
                  <button
                    v-if="editingPost.postGroupId"
                    type="button"
                    @click="editSelectedGroup"
                    class="btn btn-outline"
                  >
                    ✏️ Edit Group
                  </button>
                </div>
              </div>

              <!-- Selected group display with color -->
              <div v-if="selectedGroup" class="selected-group-display">
                <span
                  class="group-tag"
                  :style="{
                    backgroundColor: selectedGroup.groupColor + '20',
                    borderColor: selectedGroup.groupColor,
                    color: selectedGroup.groupColor
                  }"
                >
                  {{ selectedGroup.groupName }}
                </span>
              </div>

              <!-- Create New Group Modal -->
              <div v-if="showCreateGroup" class="modal-overlay">
                <div class="modal-content">
                  <h3>Create New Post Group</h3>
                  <div class="form-group">
                    <label>Group Name *</label>
                    <input
                      v-model="newGroup.groupName"
                      type="text"
                      class="form-input"
                      placeholder="Enter group name"
                      :class="{ 'error': fieldErrors.groupName }"
                    >
                    <span v-if="fieldErrors.groupName" class="error-text">{{ fieldErrors.groupName }}</span>
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <textarea v-model="newGroup.groupDescription" class="form-input" placeholder="Optional description"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Group Color</label>
                    <div class="color-picker-container">
                      <input
                        v-model="newGroup.groupColor"
                        type="color"
                        class="color-picker"
                      >
                      <span class="color-value">{{ newGroup.groupColor }}</span>
                    </div>
                  </div>
                  <div class="modal-actions">
                    <button @click="createNewGroup" class="btn btn-primary" :disabled="!newGroup.groupName">
                      Create Group
                    </button>
                    <button @click="cancelCreateGroup" class="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>

              <!-- Edit Group Modal -->
              <div v-if="showEditGroup" class="modal-overlay">
                <div class="modal-content">
                  <h3>Edit Post Group</h3>
                  <div class="form-group">
                    <label>Group Name *</label>
                    <input
                      v-model="editingGroup.groupName"
                      type="text"
                      class="form-input"
                      placeholder="Enter group name"
                      :class="{ 'error': fieldErrors.editingGroupName }"
                    >
                    <span v-if="fieldErrors.editingGroupName" class="error-text">{{ fieldErrors.editingGroupName }}</span>
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <textarea v-model="editingGroup.groupDescription" class="form-input" placeholder="Optional description"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Group Color</label>
                    <div class="color-picker-container">
                      <input
                        v-model="editingGroup.groupColor"
                        type="color"
                        class="color-picker"
                      >
                      <span class="color-value">{{ editingGroup.groupColor }}</span>
                    </div>
                  </div>
                  <div class="modal-actions">
                    <button @click="updateGroup" class="btn btn-primary" :disabled="!editingGroup.groupName">
                      Update Group
                    </button>
                    <button @click="deleteGroup" class="btn btn-danger">
                      Delete Group
                    </button>
                    <button @click="cancelEditGroup" class="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Markdown Content -->
            <div class="form-section">
              <h2>Post Content</h2>

              <div class="md-upload-area">
                <label class="file-upload-label">
                  <input
                    type="file"
                    accept=".md,.txt"
                    @change="handleMarkdownUpload"
                    class="file-input"
                  >
                  <div class="upload-box" :class="{ 'has-file': markdownFile, 'error': fieldErrors.postContent }">
                    <span v-if="!markdownFile" class="upload-placeholder">
                      📄 Upload Markdown File (.md) or edit below *
                    </span>
                    <span v-else class="file-info">
                      ✅ {{ markdownFile.name }} ({{ formatFileSize(markdownFile.size) }})
                    </span>
                  </div>
                </label>
                <span v-if="fieldErrors.postContent" class="error-text">{{ fieldErrors.postContent }}</span>
              </div>

              <div class="form-group">
                <label for="editContent">Content *</label>
                <textarea
                  id="editContent"
                  v-model="editingPost.postContent"
                  required
                  rows="10"
                  class="form-textarea"
                  placeholder="Or edit markdown content directly here..."
                ></textarea>
              </div>

              <!-- Markdown Preview -->
              <div v-if="editingPost.postContent" class="preview-section">
                <div class="preview-header">
                  <h3>Content Preview</h3>
                  <button type="button" @click="showPreview = !showPreview" class="preview-toggle">
                    {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
                  </button>
                </div>

                <div v-if="showPreview" class="preview-content">
                  <div v-html="compiledMarkdown" class="markdown-preview"></div>
                </div>
              </div>
            </div>

            <!-- Image Upload for Sequencing -->
            <div class="form-section">
              <h2>Images for Sequencing</h2>
              <p class="section-description">
                Upload images that will be referenced in your markdown as Image 1, Image 2, etc.
                Use <code>![Image Description](image{{ uploadedImages.length > 0 ? uploadedImages.length + 1 : 1 }})</code> in your markdown to reference the next image.
              </p>

              <div class="file-upload-area">
                <label class="file-upload-label">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleImageUpload"
                    :disabled="uploadedImages.length >= 20"
                    class="file-input"
                  >
                  <div class="upload-box" :class="{ 'disabled': uploadedImages.length >= 20 }">
                    <span class="upload-placeholder">
                      🖼️ Upload Images ({{ uploadedImages.length }}/20)
                    </span>
                  </div>
                </label>
              </div>

              <!-- Image Sequence List -->
              <div v-if="uploadedImages.length > 0" class="image-sequence-list">
                <h3>Image Sequence</h3>
                <div class="image-sequence-grid">
                  <div
                    v-for="(image, index) in uploadedImages"
                    :key="index"
                    class="sequence-item"
                  >
                    <div class="sequence-number">Image {{ index + 1 }}</div>
                    <img :src="getImagePreview(image.file)" :alt="image.file.name" class="sequence-preview">
                    <div class="image-details">
                      <span class="image-name">{{ image.file.name }}</span>
                      <span class="image-size">{{ formatFileSize(image.file.size) }}</span>
                    </div>
                    <button
                      type="button"
                      @click="removeImage(index)"
                      class="remove-btn"
                      title="Remove image"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Attachments -->
            <div class="form-section">
              <h2>Additional Attachments</h2>
              <p class="section-description">
                Upload any additional files (images, PDFs, documents, etc.) that will be displayed at the bottom of the post.
                Maximum file size: 100MB per file.
              </p>

              <div class="file-upload-area">
                <label class="file-upload-label">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.zip,.txt,.gif,.png,.jpg,.jpeg"
                    @change="handleAttachmentUpload"
                    :disabled="attachedFiles.length >= 10"
                    class="file-input"
                  >
                  <div class="upload-box" :class="{ 'disabled': attachedFiles.length >= 10 }">
                    <span class="upload-placeholder">
                      📎 Add Attachments ({{ attachedFiles.length }}/10)
                    </span>
                  </div>
                </label>
              </div>

              <!-- Attachment List -->
              <div v-if="attachedFiles.length > 0" class="file-list">
                <div
                  v-for="(file, index) in attachedFiles"
                  :key="index"
                  class="file-item"
                >
                  <div class="file-info">
                    <span class="file-icon">{{ getFileIcon(file.type) }}</span>
                    <div class="file-details">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      <span v-if="file.type.startsWith('image/')" class="file-type-badge">Image</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="removeAttachment(index)"
                    class="remove-btn"
                    title="Remove file"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- Image Previews for Attachments -->
              <div v-if="hasAttachmentImages" class="image-previews">
                <h3>Attachment Image Previews</h3>
                <div class="image-grid">
                  <div
                    v-for="(file, index) in attachmentImages"
                    :key="index"
                    class="image-preview-item"
                  >
                    <img :src="getImagePreview(file)" :alt="file.name" class="preview-image">
                    <span class="image-name">{{ file.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button
                type="button"
                @click="closeEditModal"
                class="btn btn-secondary"
                :disabled="isSubmitting"
              >
                Cancel
              </button>

              <button
                type="submit"
                :disabled="!isEditFormValid || isSubmitting"
                class="btn btn-primary"
              >
                <span v-if="isSubmitting">Updating Post...</span>
                <span v-else>Update Post</span>
              </button>
            </div>
          </form>
        </div>
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

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h2>🎉 Post Updated Successfully!</h2>
        <p>Your blog post has been updated and all files have been processed.</p>
        <div class="modal-actions">
          <button @click="continueEditing" class="btn btn-primary">
            Continue Editing
          </button>
          <button @click="viewPost" class="btn btn-secondary">
            View Post
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default {
  name: 'EnhancedPostEditor',

  data() {
    return {
      posts: [],
      availableTopics: [],
      availableGroups: [],
      loading: false,
      searchQuery: '',
      filterStatus: 'all',
      showEditModal: false,
      showConfirmModal: false,
      showSuccessModal: false,
      isSubmitting: false,
      showPreview: false,
      errorMessage: '',
      fieldErrors: {},
      uploadProgress: 0,
      currentTask: '',

      // Editing state
      editingPost: null,
      originalPostId: null,
      markdownFile: null,
      uploadedImages: [],
      attachedFiles: [],
      existingImages: [],
      existingAttachments: [],

      // Group management
      newGroup: {
        groupName: '',
        groupDescription: '',
        groupColor: '#007bff'
      },
      showCreateGroup: false,
      showEditGroup: false,
      editingGroup: {
        _id: '',
        groupName: '',
        groupDescription: '',
        groupColor: '#007bff'
      },

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
        this.editingPost.postContent.trim() &&
        this.editingPost.postTopics.length > 0 &&
        this.editingPost.contentType.trim()
      );
    },

    compiledMarkdown() {
      if (!this.editingPost.postContent) return '';
      const rawMarkdown = marked(this.editingPost.postContent);
      return DOMPurify.sanitize(rawMarkdown);
    },

    hasAttachmentImages() {
      return this.attachedFiles.some(file => file.type.startsWith('image/'));
    },

    attachmentImages() {
      return this.attachedFiles.filter(file => file.type.startsWith('image/'));
    },

    selectedGroup() {
      if (!this.editingPost.postGroupId) return null;
      return this.availableGroups.find(group => group._id === this.editingPost.postGroupId);
    }
  },

  async mounted() {
    await this.loadPosts();
    await this.loadTopics();
    await this.loadPostGroups();
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
        this.showError('Failed to load posts. Please check your connection.');
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

    async loadPostGroups() {
      try {
        const response = await fetch('/api/post-groups');
        if (response.ok) {
          this.availableGroups = await response.json();
        }
      } catch (error) {
        console.error('Failed to load post groups:', error);
      }
    },

    async editPost(post) {
      this.loading = true;
      try {
        // Load post details including files
        const response = await fetch(`/api/posts/${post.postId}`);
        if (!response.ok) {
          throw new Error('Failed to load post details');
        }

        const postDetails = await response.json();
        this.originalPostId = post.postId;

        // Initialize editing state
        this.editingPost = { ...postDetails };

        // Initialize file arrays
        this.uploadedImages = [];
        this.attachedFiles = [];
        this.existingImages = postDetails.images || [];
        this.existingAttachments = postDetails.attachments || [];
        this.markdownFile = null;

        // Set group ID if exists
        if (postDetails.postGroup) {
          this.editingPost.postGroupId = postDetails.postGroup.groupId;
        } else {
          this.editingPost.postGroupId = '';
        }

        // Ensure postTopics is an array
        if (!Array.isArray(this.editingPost.postTopics)) {
          this.editingPost.postTopics = this.editingPost.postTopics ? [this.editingPost.postTopics] : [];
        }

        this.showEditModal = true;
        this.errorMessage = '';
        this.fieldErrors = {};
        this.showPreview = false;
      } catch (error) {
        console.error('Error loading post details:', error);
        this.showError(`Failed to load post details: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },

    closeEditModal() {
      if (this.isSubmitting) return;

      if (this.hasUnsavedChanges() && !confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }

      this.showEditModal = false;
      this.editingPost = null;
      this.originalPostId = null;
      this.uploadedImages = [];
      this.attachedFiles = [];
      this.existingImages = [];
      this.existingAttachments = [];
      this.markdownFile = null;
      this.errorMessage = '';
      this.fieldErrors = {};
      this.showPreview = false;
    },

    hasUnsavedChanges() {
      // Check if there are any uploaded files or changes to the post
      return this.uploadedImages.length > 0 ||
             this.attachedFiles.length > 0 ||
             this.markdownFile !== null;
    },

    getTopicColor(topicName) {
      const topic = this.availableTopics.find(t => t.topicName === topicName);
      return topic ? topic.topicColor : '#6c757d';
    },

    async createNewGroup() {
      if (!this.newGroup.groupName.trim()) {
        this.fieldErrors.groupName = 'Group name is required';
        return;
      }

      try {
        const response = await fetch('/api/post-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.newGroup)
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to create group';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const newGroup = await response.json();
        this.availableGroups.push(newGroup);
        this.editingPost.postGroupId = newGroup._id;
        this.showCreateGroup = false;
        this.newGroup = { groupName: '', groupDescription: '', groupColor: '#007bff' };
        this.fieldErrors.groupName = '';
      } catch (error) {
        this.showError('Failed to create group: ' + error.message);
      }
    },

    cancelCreateGroup() {
      this.showCreateGroup = false;
      this.newGroup = { groupName: '', groupDescription: '', groupColor: '#007bff' };
      this.fieldErrors.groupName = '';
    },

    editSelectedGroup() {
      if (!this.editingPost.postGroupId) return;

      const group = this.availableGroups.find(g => g._id === this.editingPost.postGroupId);
      if (group) {
        this.editingGroup = { ...group };
        this.showEditGroup = true;
      }
    },

    async updateGroup() {
      if (!this.editingGroup.groupName.trim()) {
        this.fieldErrors.editingGroupName = 'Group name is required';
        return;
      }

      try {
        const response = await fetch(`/api/post-groups/${this.editingGroup._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupName: this.editingGroup.groupName,
            groupDescription: this.editingGroup.groupDescription,
            groupColor: this.editingGroup.groupColor
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update group';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const updatedGroup = await response.json();

        // Update the group in the available groups list
        const index = this.availableGroups.findIndex(g => g._id === updatedGroup._id);
        if (index !== -1) {
          this.availableGroups[index] = updatedGroup;
        }

        this.showEditGroup = false;
        this.editingGroup = { _id: '', groupName: '', groupDescription: '', groupColor: '#007bff' };
        this.fieldErrors.editingGroupName = '';

        this.showError('Group updated successfully!', 'success');
      } catch (error) {
        this.showError('Failed to update group: ' + error.message);
      }
    },

    async deleteGroup() {
      if (!confirm('Are you sure you want to delete this group? Posts will keep their content but will no longer be associated with this group.')) {
        return;
      }

      try {
        const response = await fetch(`/api/post-groups/${this.editingGroup._id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to delete group');
        }

        // Remove group from available groups
        this.availableGroups = this.availableGroups.filter(g => g._id !== this.editingGroup._id);

        // Clear selected group if it was the deleted one
        if (this.editingPost.postGroupId === this.editingGroup._id) {
          this.editingPost.postGroupId = '';
        }

        this.showEditGroup = false;
        this.editingGroup = { _id: '', groupName: '', groupDescription: '', groupColor: '#007bff' };

        this.showError('Group deleted successfully!', 'success');
      } catch (error) {
        this.showError('Failed to delete group: ' + error.message);
      }
    },

    cancelEditGroup() {
      this.showEditGroup = false;
      this.editingGroup = { _id: '', groupName: '', groupDescription: '', groupColor: '#007bff' };
      this.fieldErrors.editingGroupName = '';
    },

    handleMarkdownUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith('.md') && !file.type.includes('text/')) {
        this.showError('Please upload a valid Markdown file (.md)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('Markdown file size must be less than 5MB');
        return;
      }

      this.markdownFile = file;
      this.readMarkdownFile(file);
      this.clearFieldError('postContent');
    },

    readMarkdownFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.editingPost.postContent = e.target.result;
      };
      reader.onerror = () => {
        this.showError('Error reading markdown file');
      };
      reader.readAsText(file);
    },

    handleImageUpload(event) {
      const files = Array.from(event.target.files);
      const remainingSlots = 20 - this.uploadedImages.length;

      if (files.length > remainingSlots) {
        this.showError(`You can only upload ${remainingSlots} more images.`);
        return;
      }

      // Validate file sizes (10MB limit for images)
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        this.showError('Some images exceed the 10MB size limit');
        return;
      }

      // Add images with their sequence numbers
      files.forEach(file => {
        this.uploadedImages.push({
          file: file,
          sequence: this.uploadedImages.length + 1
        });
      });

      event.target.value = '';
    },

    handleAttachmentUpload(event) {
      const files = Array.from(event.target.files);
      const remainingSlots = 10 - this.attachedFiles.length;

      if (files.length > remainingSlots) {
        this.showError(`You can only upload ${remainingSlots} more attachments.`);
        return;
      }

      // Validate file sizes (100MB limit for attachments)
      const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        this.showError('Some files exceed the 100MB size limit');
        return;
      }

      this.attachedFiles.push(...files);
      event.target.value = '';
    },

    removeImage(index) {
      this.uploadedImages.splice(index, 1);
      // Update sequence numbers
      this.uploadedImages.forEach((img, idx) => {
        img.sequence = idx + 1;
      });
    },

    removeAttachment(index) {
      this.attachedFiles.splice(index, 1);
    },

    getFileIcon(fileType) {
      if (fileType.startsWith('image/')) return '🖼️';
      if (fileType.includes('pdf')) return '📄';
      if (fileType.includes('zip')) return '📦';
      if (fileType.includes('document')) return '📝';
      return '📎';
    },

    getImagePreview(file) {
      return URL.createObjectURL(file);
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    truncateContent(content) {
      return content.length > 150 ? content.substring(0, 150) + '...' : content;
    },

    getTopicStyle(topicName) {
      const topic = this.availableTopics.find(t => t.topicName === topicName);
      if (!topic) return {};

      return {
        backgroundColor: topic.topicColor + '20',
        borderColor: topic.topicColor,
        color: topic.topicColor
      };
    },

    async updatePost() {
      if (!this.validateForm()) {
        return;
      }

      this.isSubmitting = true;
      this.uploadProgress = 0;
      this.currentTask = 'Preparing post data...';

      try {
        const formData = new FormData();

        // Add post data
        formData.append('postData', JSON.stringify({
          postTitle: this.editingPost.postTitle,
          postAuthor: this.editingPost.postAuthor,
          postContent: this.editingPost.postContent,
          postTopics: this.editingPost.postTopics,
          contentType: this.editingPost.contentType,
          isPublished: this.editingPost.isPublished,
          postGroupId: this.editingPost.postGroupId || null
        }));

        // Add markdown file if uploaded
        if (this.markdownFile) {
          formData.append('markdownFile', this.markdownFile);
        }

        // Add sequence images
        this.uploadedImages.forEach((imageData, index) => {
          formData.append(`sequenceImages`, imageData.file);
        });

        // Add attachments
        this.attachedFiles.forEach((file, index) => {
          formData.append(`attachments`, file);
        });

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          if (this.uploadProgress < 90) {
            this.uploadProgress += 10;
            this.currentTask = `Uploading files... (${this.uploadProgress}%)`;
          }
        }, 200);

        const response = await fetch(`/api/posts/${this.originalPostId}`, {
          method: 'PUT',
          body: formData
        });

        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.currentTask = 'Processing post...';

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update post';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const updatedPost = await response.json();

        // Update the post in the posts list
        const index = this.posts.findIndex(p => p.postId === this.originalPostId);
        if (index !== -1) {
          this.posts[index] = updatedPost;
        }

        this.showSuccessModal = true;
      } catch (error) {
        console.error('Error updating post:', error);
        this.showError(`Failed to update post: ${error.message}`);
      } finally {
        this.isSubmitting = false;
        this.uploadProgress = 0;
      }
    },

    validateForm() {
      this.fieldErrors = {};

      if (!this.editingPost.postTitle.trim()) {
        this.fieldErrors.postTitle = 'Post title is required';
      }

      if (!this.editingPost.postAuthor.trim()) {
        this.fieldErrors.postAuthor = 'Author name is required';
      }

      if (!this.editingPost.postContent.trim()) {
        this.fieldErrors.postContent = 'Post content is required';
      }

      if (!this.editingPost.postTopics.length || !this.editingPost.postTopics[0]) {
        this.fieldErrors.postTopics = 'Please select a topic';
      }

      if (!this.editingPost.contentType) {
        this.fieldErrors.contentType = 'Content type is required';
      }

      return Object.keys(this.fieldErrors).length === 0;
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
      }
    },

    async togglePublishStatus(post) {
      try {
        const response = await fetch(`/api/posts/${post.postId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPublished: !post.isPublished
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update post status');
        }

        const updatedPost = await response.json();

        // Update the post in the list
        const index = this.posts.findIndex(p => p.postId === post.postId);
        if (index !== -1) {
          this.posts[index] = updatedPost;
        }

        this.showError(
          `Post ${updatedPost.isPublished ? 'published' : 'unpublished'} successfully!`,
          'success'
        );
      } catch (error) {
        console.error('Error updating post status:', error);
        this.showError('Failed to update post status');
      }
    },

    deletePost(post) {
      this.confirmAction = {
        title: 'Delete Post',
        message: `Are you sure you want to delete "${post.postTitle}"? This action cannot be undone.`,
        confirmText: 'Delete Post',
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

        // Remove post from the list
        this.posts = this.posts.filter(p => p.postId !== post.postId);
        this.showConfirmModal = false;

        this.showError('Post deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting post:', error);
        this.showError('Failed to delete post');
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

    continueEditing() {
      this.showSuccessModal = false;
      // Keep the modal open for further editing
    },

    viewPost() {
      this.showSuccessModal = false;
      this.closeEditModal();
      // Navigate to the post view
      if (this.originalPostId) {
        this.$router.push(`/posts/${this.originalPostId}`);
      }
    },

    showError(message, type = 'error') {
      this.errorMessage = message;

      if (type === 'success') {
        // Auto-hide success messages after 3 seconds
        setTimeout(() => {
          this.clearError();
        }, 3000);
      }
    },

    clearError() {
      this.errorMessage = '';
    }
  }
};
</script>

<style scoped>
.post-editor {
  max-width: 1200px;
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

.header-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 250px;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  right: 15px;
  color: #666;
}

.status-filter {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
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

.posts-list {
  display: grid;
  gap: 20px;
}

.post-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.post-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.post-card.published {
  border-left: 4px solid #28a745;
}

.post-card.draft {
  border-left: 4px solid #ffc107;
}

.post-header {
  margin-bottom: 15px;
}

.post-title {
  font-size: 1.4em;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
}

.post-meta {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 0.9em;
  color: #666;
}

.post-status {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.post-status.published {
  background: #d4edda;
  color: #155724;
}

.post-status.draft {
  background: #fff3cd;
  color: #856404;
}

.post-content-preview {
  color: #666;
  line-height: 1.5;
  margin-bottom: 15px;
}

.post-topics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.topic-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 500;
  border: 1px solid;
}

.post-group {
  margin-bottom: 15px;
}

.group-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  border: 1px solid;
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
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-edit {
  background: #17a2b8;
  color: white;
}

.btn-edit:hover {
  background: #138496;
}

.btn-publish {
  background: #28a745;
  color: white;
}

.btn-publish:hover {
  background: #218838;
}

.btn-unpublish {
  background: #ffc107;
  color: #212529;
}

.btn-unpublish:hover {
  background: #e0a800;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.edit-modal {
  max-width: 900px;
  width: 95%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e0e0e0;
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
  color: #666;
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

.modal-body {
  padding: 30px;
}

/* Form Styles */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  background: #fafafa;
}

.form-section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3em;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-input.error,
.form-textarea.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
  display: block;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-label {
  margin: 0;
  cursor: pointer;
}

/* File Upload Styles */
.file-upload-label {
  display: block;
  cursor: pointer;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  background: white;
}

.upload-box:hover:not(.disabled) {
  border-color: #007bff;
  background: #f8f9fa;
}

.upload-box.has-file {
  border-color: #28a745;
  background: #f8fff9;
}

.upload-box.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-placeholder {
  color: #666;
  font-size: 14px;
}

.file-info {
  color: #28a745;
  font-weight: 500;
}

/* Image and File Lists */
.image-sequence-list,
.file-list {
  margin-top: 20px;
}

.image-sequence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.sequence-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: white;
  text-align: center;
}

.sequence-number {
  font-weight: 600;
  color: #007bff;
  margin-bottom: 10px;
}

.sequence-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 10px;
}

.image-details {
  font-size: 0.85em;
  color: #666;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 0.8em;
  color: #666;
}

.file-type-badge {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7em;
  margin-top: 2px;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc3545;
  padding: 5px;
  border-radius: 4px;
}

.remove-btn:hover {
  background: #f8d7da;
}

/* Preview Section */
.preview-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.preview-toggle {
  background: #6c757d;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}

.preview-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-preview {
  line-height: 1.6;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.markdown-preview p {
  margin-bottom: 1em;
}

.markdown-preview code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-preview pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-preview pre code {
  background: none;
  padding: 0;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 30px;
}

.upload-progress {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.current-task {
  margin-top: 15px;
  color: #666;
  font-size: 0.9em;
}

/* Error and Success States */
.error-alert {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  color: #721c24;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #721c24;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  background: white;
  border-radius: 12px;
  border: 2px dashed #ddd;
}

/* Color Picker */
.color-picker-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.color-picker {
  width: 60px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #666;
}

/* Group Selection */
.group-selection {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.selected-topic-display,
.selected-group-display {
  margin-top: 10px;
}

/* Image Previews */
.image-previews {
  margin-top: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.image-preview-item {
  text-align: center;
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.image-name {
  display: block;
  margin-top: 8px;
  font-size: 0.8em;
  color: #666;
  word-break: break-word;
}

/* Section Description */
.section-description {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
  line-height: 1.5;
}

.section-description code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-top: 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .post-editor {
    padding: 15px;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-controls {
    justify-content: space-between;
  }

  .search-input {
    width: 100%;
  }

  .post-meta {
    flex-direction: column;
    gap: 5px;
  }

  .post-actions {
    justify-content: center;
  }

  .modal-content {
    margin: 10px;
    width: calc(100% - 20px);
  }

  .edit-modal {
    width: calc(100% - 20px);
  }

  .modal-body {
    padding: 20px;
  }

  .form-section {
    padding: 15px;
  }

  .group-selection {
    flex-direction: column;
    align-items: stretch;
  }

  .form-actions {
    flex-direction: column;
  }

  .image-sequence-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .post-card {
    padding: 15px;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .upload-box {
    padding: 20px;
  }
}
</style>
