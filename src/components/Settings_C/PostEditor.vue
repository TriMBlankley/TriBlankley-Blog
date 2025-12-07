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
            <span class="post-author">By {{ formatAuthors(post.postAuthor) }}</span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            <span class="post-status" :class="post.isPublished ? 'published' : 'draft'">
              {{ post.isPublished ? 'Published' : 'Draft' }}
            </span>
            <span class="post-content-type">{{ post.contentType }}</span>
            <span v-if="post.showGalleryView" class="gallery-view-badge">Gallery</span>
            <span v-if="post.isNSFW" class="NSFW-badge">NSFW</span>
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

    <!-- Edit Post Modal - Updated to match PostCreator -->
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

              <!-- Post Authors (Multiple) -->
              <div class="form-group">
                <label for="postAuthor">Authors *</label>
                <div class="authors-input-container">
                  <div class="author-input-group">
                    <input id="postAuthor" v-model="currentAuthor" type="text"
                      placeholder="Enter author name and press Enter"
                      class="form-input" :class="{ 'error': fieldErrors.postAuthor }"
                      @keypress="handleAuthorKeypress">
                    <button type="button" @click="addAuthor" class="btn btn-outline add-author-btn">
                      Add
                    </button>
                  </div>
                  <span v-if="fieldErrors.postAuthor" class="error-text">{{ fieldErrors.postAuthor }}</span>

                  <!-- Authors List -->
                  <div v-if="editingPost.postAuthor.length > 0" class="authors-list">
                    <div v-for="(author, index) in editingPost.postAuthor" :key="index" class="author-tag">
                      <span>{{ author }}</span>
                      <button type="button" @click="removeAuthor(index)" class="remove-author-btn" title="Remove author">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
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

              <div class="form-group">
                <label for="editGalleryView">Gallery View</label>
                <div class="checkbox-group">
                  <input
                    id="editGalleryView"
                    v-model="editingPost.showGalleryView"
                    type="checkbox"
                  >
                  <label for="editGalleryView" class="checkbox-label">
                    Show Gallery View?
                  </label>
                </div>
                <p class="field-description">When enabled, this post will display in a gallery format instead of the standard blog view.</p>
              </div>

              <div class="form-group">
                <label for="editIsNSFW">Is NSFW</label>
                <div class="checkbox-group">
                  <input
                    id="editIsNSFW"
                    v-model="editingPost.isNSFW"
                    type="checkbox"
                  >
                  <label for="editIsNSFW" class="checkbox-label">
                    Does the post contrain not-safe-for-work content?
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
                  v-model="selectedTopic"
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

              <div v-if="selectedTopic" class="selected-topic-display">
                <span class="topic-tag" :style="{
                  backgroundColor: getTopicColor(selectedTopic) + '20',
                  borderColor: getTopicColor(selectedTopic)
                }">
                  {{ selectedTopic }}
                </span>
              </div>
            </div>

            <!-- Post Group Selection -->
            <div class="form-section">
              <h2>Post Group (Optional)</h2>
              <div class="form-group">
                <label>Assign to Post Group</label>
                <div class="group-selection">
                  <select v-model="selectedGroupId" class="form-input">
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
                    v-if="selectedGroupId"
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
                      📄 Upload Markdown File (.md) *
                    </span>
                    <span v-else class="file-info">
                      ✅ {{ markdownFile.name }} ({{ formatFileSize(markdownFile.size) }})
                    </span>
                  </div>
                </label>
                <span v-if="fieldErrors.postContent" class="error-text">{{ fieldErrors.postContent }}</span>
              </div>

              <!-- Direct Content Editing -->
              <div class="form-group">
                <label for="editContent">Content *</label>
                <textarea
                  id="editContent"
                  v-model="editingPost.postContent"
                  required
                  rows="10"
                  class="form-textarea"
                  placeholder="Edit markdown content directly here..."
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

            <!-- Sequenced Attachments -->
            <div class="form-section">
              <h2>Sequenced Attachments</h2>
              <p class="section-description">
                Upload images, audio, or video files that will be referenced in your markdown as Image 1, Audio 1, Video 1, etc.
                Use
                <code>![Description](image{{sequencedAttachments.filter(a => a.attachmentType === 'image').length + 1}})</code>
                for images,
                <code>[Description](audio{{sequencedAttachments.filter(a => a.attachmentType === 'audio').length + 1}})</code>
                for audio, or
                <code>[Description](video{{sequencedAttachments.filter(a => a.attachmentType === 'video').length + 1}})</code>
                for video in your markdown.
              </p>

              <div class="file-upload-area">
                <label class="file-upload-label">
                  <input type="file" multiple accept="image/*,audio/*,video/*" @change="handleSequencedAttachmentUpload"
                    :disabled="sequencedAttachments.length >= 20" class="file-input">
                  <div class="upload-box" :class="{ 'disabled': sequencedAttachments.length >= 20 }">
                    <span class="upload-placeholder">
                      📁 Upload Sequenced Attachments ({{ sequencedAttachments.length }}/20)
                    </span>
                  </div>
                </label>
              </div>

              <!-- Sequenced Attachments List -->
              <div v-if="sequencedAttachments.length > 0" class="attachments-list">
                <div v-for="(attachment, index) in sequencedAttachments" :key="index" class="attachment-item sequenced">
                  <div class="attachment-preview">
                    <div v-if="attachment.file.type.startsWith('image/')" class="image-preview">
                      <img :src="getImagePreview(attachment.file)" :alt="attachment.file.name">
                    </div>
                    <div v-else class="file-icon">
                      {{ getSequencedAttachmentIcon(attachment.attachmentType) }}
                    </div>
                  </div>
                  <div class="attachment-info">
                    <div class="attachment-name">{{ attachment.file.name }}</div>
                    <div class="attachment-meta">
                      <span class="file-size">{{ formatFileSize(attachment.file.size) }}</span>
                      <span class="sequence-number">Sequence: {{ attachment.sequence }}</span>

                      <!-- Attachment Type Selector -->
                      <div class="attachment-type-selector">
                        <label>Type:</label>
                        <select :value="attachment.attachmentType" @change="updateAttachmentType(index, $event.target.value)"
                          class="type-select">
                          <option value="image">Image</option>
                          <option value="audio">Audio</option>
                          <option value="video">Video</option>
                        </select>
                      </div>

                      <!-- Type Badge Display -->
                      <span class="type-badge" :class="attachment.attachmentType">
                        {{ getSequencedAttachmentTypeLabel(attachment.attachmentType) }}
                      </span>
                    </div>
                  </div>
                  <button type="button" @click="removeSequencedAttachment(index)" class="remove-btn"
                    title="Remove attachment">
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Additional Attachments -->
            <div class="form-section">
              <h2>Additional Attachments</h2>
              <p class="section-description">
                Upload additional files that will be available for download with your post.
              </p>

              <div class="file-upload-area">
                <label class="file-upload-label">
                  <input type="file" multiple @change="handleAttachmentUpload" :disabled="attachedFiles.length >= 10"
                    class="file-input">
                  <div class="upload-box" :class="{ 'disabled': attachedFiles.length >= 10 }">
                    <span class="upload-placeholder">
                      📎 Upload Additional Files ({{ attachedFiles.length }}/10)
                    </span>
                  </div>
                </label>
              </div>

              <!-- Attachments List -->
              <div v-if="attachedFiles.length > 0" class="attachments-list">
                <div v-for="(file, index) in attachedFiles" :key="index" class="attachment-item">
                  <div class="attachment-info">
                    <div class="attachment-header">
                      <span class="attachment-name">{{ file.name }}</span>
                    </div>
                    <div class="attachment-details">
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      <span class="file-type">{{ getFileTypeLabel(file.type, file.name) }}</span>
                    </div>
                  </div>
                  <button type="button" @click="removeAttachment(index)" class="remove-btn" title="Remove attachment">
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Existing Files Information -->
            <div v-if="existingFiles.length > 0" class="form-section">
              <h2>Existing Files</h2>
              <p class="section-description">
                Files currently attached to this post. These will remain unless you delete them.
              </p>

              <div class="existing-files-list">
                <div v-for="(file, index) in existingFiles" :key="index" class="existing-file-item">
                  <div class="file-info">
                    <span class="file-icon">{{ getFileIcon(file.type) }}</span>
                    <div class="file-details">
                      <span class="file-name">{{ file.filename }}</span>
                      <span class="file-meta">
                        <span class="file-size">{{ formatFileSize(file.size) }}</span>
                        <span class="file-type">{{ file.attachmentType || file.fileType }}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="confirmDeleteFile(file)"
                    class="btn btn-danger btn-sm"
                    title="Delete file"
                  >
                    🗑️
                  </button>
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

const getSessionToken = () => {
  return localStorage.getItem('settingsSessionToken');
}

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
      currentAuthor: '',
      selectedTopic: '',
      selectedGroupId: '',
      sequencedAttachments: [],
      attachedFiles: [],
      existingFiles: [],

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
          this.formatAuthors(post.postAuthor).toLowerCase().includes(query) ||
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
        this.editingPost.postAuthor.length > 0 &&
        this.editingPost.postContent.trim() &&
        this.selectedTopic.trim() &&
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
      if (!this.selectedGroupId) return null;
      return this.availableGroups.find(group => group._id === this.selectedGroupId);
    }
  },

  watch: {
    selectedTopic(newTopic) {
      if (newTopic) {
        this.editingPost.postTopics = [newTopic];
      } else {
        this.editingPost.postTopics = [];
      }
      this.clearFieldError('postTopics');
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

        // Initialize editing state with all fields
        this.editingPost = {
          postTitle: postDetails.postTitle || '',
          postAuthor: Array.isArray(postDetails.postAuthor) ? postDetails.postAuthor :
                     postDetails.postAuthor ? [postDetails.postAuthor] : [],
          postContent: postDetails.postContent || '',
          postTopics: Array.isArray(postDetails.postTopics) ? postDetails.postTopics :
                     postDetails.postTopics ? [postDetails.postTopics] : [],
          contentType: postDetails.contentType || 'Text',
          isPublished: postDetails.isPublished || false,
          showGalleryView: postDetails.showGalleryView || false,
          isNSFW: postDetails.isNSFW || false,
          postGroup: postDetails.postGroup || null
        };

        // Set selected topic
        this.selectedTopic = this.editingPost.postTopics[0] || '';

        // Set selected group
        this.selectedGroupId = postDetails.postGroup?.groupId || '';

        // Initialize file arrays
        this.currentAuthor = '';
        this.sequencedAttachments = [];
        this.attachedFiles = [];
        this.markdownFile = null;

        // Load existing files if available
        if (postDetails.files) {
          this.existingFiles = postDetails.files;
        } else {
          this.existingFiles = [];
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
      this.currentAuthor = '';
      this.selectedTopic = '';
      this.selectedGroupId = '';
      this.sequencedAttachments = [];
      this.attachedFiles = [];
      this.existingFiles = [];
      this.markdownFile = null;
      this.errorMessage = '';
      this.fieldErrors = {};
      this.showPreview = false;
    },

    hasUnsavedChanges() {
      // Check if there are any uploaded files or changes to the post
      return this.sequencedAttachments.length > 0 ||
             this.attachedFiles.length > 0 ||
             this.markdownFile !== null ||
             (this.editingPost && this.checkPostChanges());
    },

    checkPostChanges() {
      if (!this.editingPost) return false;

      // Get original post
      const originalPost = this.posts.find(p => p.postId === this.originalPostId);
      if (!originalPost) return true;

      // Check for changes in main fields
      return originalPost.postTitle !== this.editingPost.postTitle ||
             JSON.stringify(originalPost.postAuthor) !== JSON.stringify(this.editingPost.postAuthor) ||
             originalPost.postContent !== this.editingPost.postContent ||
             JSON.stringify(originalPost.postTopics) !== JSON.stringify(this.editingPost.postTopics) ||
             originalPost.contentType !== this.editingPost.contentType ||
             originalPost.isPublished !== this.editingPost.isPublished ||
             originalPost.showGalleryView !== this.editingPost.showGalleryView ||
             originalPost.postGroup?.groupId !== this.selectedGroupId;
    },

    // NEW: Add author to the list
    addAuthor() {
      if (this.currentAuthor.trim() && !this.editingPost.postAuthor.includes(this.currentAuthor.trim())) {
        this.editingPost.postAuthor.push(this.currentAuthor.trim());
        this.currentAuthor = '';
        this.clearFieldError('postAuthor');
      }
    },

    // NEW: Remove author from the list
    removeAuthor(index) {
      this.editingPost.postAuthor.splice(index, 1);
    },

    // NEW: Handle Enter key in author input
    handleAuthorKeypress(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.addAuthor();
      }
    },

    formatAuthors(authors) {
      if (Array.isArray(authors)) {
        return authors.join(', ');
      }
      return authors || 'Unknown';
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
        const sessionToken = getSessionToken() || '';
        const response = await fetch('/api/post-groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
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
        this.selectedGroupId = newGroup._id;
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
      if (!this.selectedGroupId) return;

      const group = this.availableGroups.find(g => g._id === this.selectedGroupId);
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
        if (this.selectedGroupId === this.editingGroup._id) {
          this.selectedGroupId = '';
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

    // UPDATED: Handle sequenced attachment upload with automatic type detection
    handleSequencedAttachmentUpload(event) {
      const files = Array.from(event.target.files);
      const remainingSlots = 20 - this.sequencedAttachments.length;

      if (files.length > remainingSlots) {
        this.showError(`You can only upload ${remainingSlots} more sequenced attachments.`);
        return;
      }

      // Validate file sizes (100MB limit for all sequenced attachments)
      const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        this.showError('Some files exceed the 100MB size limit');
        return;
      }

      // Add files with their sequence numbers and auto-detect type
      files.forEach(file => {
        this.sequencedAttachments.push({
          file: file,
          sequence: this.sequencedAttachments.length + 1,
          attachmentType: this.detectAttachmentType(file) // Auto-detect type
        });
      });

      event.target.value = '';
    },

    // UPDATED: Enhanced type detection
    detectAttachmentType(file) {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('audio/')) return 'audio';
      if (file.type.startsWith('video/')) return 'video';

      // Fallback based on extension
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.ogg') ||
        fileName.endsWith('.flac') || fileName.endsWith('.aac') || fileName.endsWith('.m4a')) {
        return 'audio';
      }
      if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov') ||
        fileName.endsWith('.mkv') || fileName.endsWith('.webm') || fileName.endsWith('.m4v') ||
        fileName.endsWith('.wmv') || fileName.endsWith('.flv')) {
        return 'video';
      }

      return 'image'; // Default to image for compatibility
    },

    // Update attachment type
    updateAttachmentType(index, newType) {
      this.sequencedAttachments[index].attachmentType = newType;
    },

    // Remove sequenced attachment
    removeSequencedAttachment(index) {
      this.sequencedAttachments.splice(index, 1);
      // Update sequence numbers
      this.sequencedAttachments.forEach((attachment, idx) => {
        attachment.sequence = idx + 1;
      });
    },

    // Get icon for sequenced attachment
    getSequencedAttachmentIcon(attachmentType) {
      switch (attachmentType) {
        case 'image': return '🖼️';
        case 'audio': return '🎵';
        case 'video': return '🎬';
        default: return '📎';
      }
    },

    // Get type label for sequenced attachment
    getSequencedAttachmentTypeLabel(attachmentType) {
      switch (attachmentType) {
        case 'image': return 'Image';
        case 'audio': return 'Audio';
        case 'video': return 'Video';
        default: return 'File';
      }
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

      // Validate for potentially dangerous file types if needed
      const dangerousFiles = files.filter(file => this.isPotentiallyDangerous(file));
      if (dangerousFiles.length > 0) {
        if (!confirm('Warning: You are uploading executable files. Make sure you trust these files. Continue?')) {
          return;
        }
      }

      this.attachedFiles.push(...files);
      event.target.value = '';
    },

    isPotentiallyDangerous(file) {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.vbs'];
      const fileName = file.name.toLowerCase();
      return dangerousExtensions.some(ext => fileName.endsWith(ext));
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

    getFileTypeLabel(fileType, fileName = '') {
      if (fileType.startsWith('image/')) return 'Image';
      if (fileType.includes('pdf')) return 'PDF';
      if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar') ||
        fileType.includes('7z') || fileName.endsWith('.zip') || fileName.endsWith('.rar')) return 'Archive';
      if (fileType.includes('document') || fileType.includes('word') ||
        fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'Word Doc';
      if (fileType.includes('spreadsheet') || fileType.includes('excel') ||
        fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'Spreadsheet';
      if (fileType.includes('presentation') || fileType.includes('powerpoint') ||
        fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'Presentation';
      if (fileType.includes('text/') || fileName.endsWith('.txt')) return 'Text';
      if (fileType.includes('audio/')) return 'Audio';
      if (fileType.includes('video/')) return 'Video';
      if (fileName.endsWith('.exe') || fileName.endsWith('.msi')) return 'Executable';
      if (fileName.endsWith('.js')) return 'JavaScript';
      if (fileName.endsWith('.py')) return 'Python';
      if (fileName.endsWith('.java')) return 'Java';

      // Extract extension for unknown types
      const extension = fileName.split('.').pop();
      return extension ? extension.toUpperCase() : 'File';
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

    validateForm() {
      this.fieldErrors = {};

      if (!this.editingPost.postTitle.trim()) {
        this.fieldErrors.postTitle = 'Post title is required';
      }

      if (this.editingPost.postAuthor.length === 0) {
        this.fieldErrors.postAuthor = 'At least one author is required';
      }

      if (!this.editingPost.postContent.trim()) {
        this.fieldErrors.postContent = 'Post content is required';
      }

      if (!this.selectedTopic.trim()) {
        this.fieldErrors.postTopics = 'Please select a post topic';
      }

      if (!this.editingPost.contentType.trim()) {
        this.fieldErrors.contentType = 'Please select a content type';
      }

      return Object.keys(this.fieldErrors).length === 0;
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
      }
    },

    async uploadFileToGridFS(postId, file, fileType = 'attachment', sequence = 0, attachmentType = 'image') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const sessionToken = getSessionToken() || '';
            const base64Data = reader.result.split(',')[1];
            const response = await fetch(`/api/upload/${postId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': sessionToken
              },
              body: JSON.stringify({
                filename: file.name,
                base64Data: base64Data,
                fileType: fileType,
                sequence: sequence,
                attachmentType: attachmentType
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `Upload failed: ${response.statusText}`;
              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }
              throw new Error(errorMessage);
            }

            const result = await response.json();
            resolve(result.fileId);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });
    },

    async updatePost() {
      if (!this.validateForm()) {
        this.showError('Please fix the form errors before submitting');
        return;
      }

      this.isSubmitting = true;
      this.uploadProgress = 0;
      this.errorMessage = '';

      try {
        // Prepare post data with group information
        const postData = { ...this.editingPost };

        if (this.selectedGroupId) {
          const selectedGroup = this.availableGroups.find(g => g._id === this.selectedGroupId);
          postData.postGroup = {
            groupId: this.selectedGroupId,
            groupName: selectedGroup.groupName,
            groupColor: selectedGroup.groupColor,
            sequence: 0
          };
        } else {
          postData.postGroup = null;
        }

        // Ensure postTopics is properly set
        postData.postTopics = [this.selectedTopic];

        // 1. Update the post
        this.currentTask = 'Updating post...';
        this.uploadProgress = 10;

        const sessionToken = getSessionToken() || '';
        const postResponse = await fetch(`/api/posts/${this.originalPostId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
          },
          body: JSON.stringify(postData)
        });

        if (!postResponse.ok) {
          const errorText = await postResponse.text();
          let errorMessage = 'Failed to update post';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const updatedPost = await postResponse.json();
        this.uploadProgress = 30;

        // 2. Upload sequenced attachments (images, audio, video)
        if (this.sequencedAttachments.length > 0) {
          this.currentTask = 'Uploading sequenced attachments...';
          const attachmentCount = this.sequencedAttachments.length;

          for (let i = 0; i < this.sequencedAttachments.length; i++) {
            const attachment = this.sequencedAttachments[i];
            this.currentTask = `Uploading sequenced ${attachment.attachmentType} ${i + 1} of ${attachmentCount}...`;

            await this.uploadFileToGridFS(
              this.originalPostId,
              attachment.file,
              'in-text',
              attachment.sequence,
              attachment.attachmentType
            );

            this.uploadProgress = 30 + (i / attachmentCount) * 30;
          }
        }

        // 3. Upload additional attachments (including images)
        if (this.attachedFiles.length > 0) {
          this.currentTask = 'Uploading attachments...';
          const attachmentCount = this.attachedFiles.length;

          for (let i = 0; i < this.attachedFiles.length; i++) {
            const file = this.attachedFiles[i];
            const fileType = file.type.startsWith('image/') ? 'image' : 'attachment';
            this.currentTask = `Uploading attachment ${i + 1} of ${attachmentCount}...`;

            await this.uploadFileToGridFS(this.originalPostId, file, fileType);

            this.uploadProgress = 60 + (i / attachmentCount) * 35;
          }
        }

        this.uploadProgress = 100;
        this.currentTask = 'Finalizing...';

        // Update the post in the list
        const index = this.posts.findIndex(p => p.postId === this.originalPostId);
        if (index !== -1) {
          this.posts[index] = updatedPost;
        }

        // Show success modal
        setTimeout(() => {
          this.showSuccessModal = true;
          this.isSubmitting = false;
        }, 500);

      } catch (error) {
        console.error('Error updating post:', error);
        this.showError(`Failed to update post: ${error.message}`);
        this.isSubmitting = false;
      }
    },

    confirmDeleteFile(file) {
      this.confirmAction = {
        title: 'Delete File',
        message: `Are you sure you want to delete "${file.filename}"? This action cannot be undone.`,
        confirmText: 'Delete File',
        action: () => this.deleteFile(file)
      };
      this.showConfirmModal = true;
    },

    async deleteFile(file) {
      try {
        const response = await fetch(`/api/files/${file._id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete file');
        }

        // Remove file from existing files list
        this.existingFiles = this.existingFiles.filter(f => f._id !== file._id);
        this.showConfirmModal = false;

        this.showError('File deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting file:', error);
        this.showError('Failed to delete file');
      }
    },

    async togglePublishStatus(post) {
      try {
        const sessionToken = getSessionToken() || '';
        const response = await fetch(`/api/posts/${post.postId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
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
        const sessionToken = getSessionToken() || '';
        const response = await fetch(`/api/posts/${post.postId}`, {
          method: 'DELETE',
          headers: {
            'X-Session-Token': sessionToken
          }
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
        this.$router.push(`/BlogPage/${this.originalPostId}`);
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
  },

  beforeUnmount() {
    // Clean up object URLs to prevent memory leaks
    this.sequencedAttachments.forEach(attachment => {
      if (attachment.file.type.startsWith('image/')) {
        URL.revokeObjectURL(this.getImagePreview(attachment.file));
      }
    });
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

.gallery-view-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
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

.btn-sm {
  padding: 4px 8px;
  font-size: 0.8em;
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

.field-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 5px;
  font-style: italic;
}

/* Multiple Authors Styles */
.authors-input-container {
  margin-bottom: 10px;
}

.author-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.author-input-group .form-input {
  flex: 1;
}

.add-author-btn {
  white-space: nowrap;
}

.authors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.author-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #e9ecef;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.remove-author-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-author-btn:hover {
  background-color: #dc3545;
  color: white;
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

/* Attachments List */
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.attachment-item.sequenced {
  border-left: 4px solid #007bff;
}

.attachment-info {
  flex: 1;
}

.attachment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.attachment-name {
  font-weight: 500;
  color: #333;
}

.attachment-details {
  display: flex;
  gap: 15px;
  align-items: center;
}

.file-size,
.file-type {
  color: #666;
  font-size: 0.85rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 4px;
}

.remove-btn:hover {
  background-color: #f8d7da;
}

/* Sequenced Attachment Styles */
.attachment-preview {
  margin-right: 15px;
}

.image-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.file-icon {
  font-size: 2rem;
}

.attachment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sequence-number {
  background-color: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.attachment-type-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attachment-type-selector label {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

.type-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.image {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-badge.audio {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.video {
  background-color: #fff3e0;
  color: #f57c00;
}

/* Existing Files */
.existing-files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.existing-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.existing-file-item .file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.existing-file-item .file-icon {
  font-size: 1.5rem;
}

.existing-file-item .file-details {
  display: flex;
  flex-direction: column;
}

.existing-file-item .file-name {
  font-weight: 500;
}

.existing-file-item .file-meta {
  display: flex;
  gap: 10px;
  font-size: 0.85em;
  color: #666;
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

  .author-input-group {
    flex-direction: column;
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
