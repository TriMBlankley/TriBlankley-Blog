<!-- [file name]: PostCreator.vue -->
<template>
  <div class="blog-post-creator">
    <div class="creator-header">
      <h1>Create New Blog Post</h1>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isSubmitting" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>Uploading Post...</h3>
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

    <form @submit.prevent="submitPost" class="post-form">
      <!-- Basic Post Information -->
      <div class="form-section">
        <h2>Post Information</h2>

        <div class="form-group">
          <label for="postTitle">Post Title *</label>
          <input
            id="postTitle"
            v-model="postData.postTitle"
            type="text"
            required
            placeholder="Enter post title"
            class="form-input"
            :class="{ 'error': fieldErrors.postTitle }"
          >
          <span v-if="fieldErrors.postTitle" class="error-text">{{ fieldErrors.postTitle }}</span>
        </div>

        <div class="form-group">
          <label for="postAuthor">Author *</label>
          <input
            id="postAuthor"
            v-model="postData.postAuthor"
            type="text"
            required
            placeholder="Enter author name"
            class="form-input"
            :class="{ 'error': fieldErrors.postAuthor }"
          >
          <span v-if="fieldErrors.postAuthor" class="error-text">{{ fieldErrors.postAuthor }}</span>
        </div>

        <div class="form-group">
          <label for="isPublished">Publish Status</label>
          <div class="checkbox-group">
            <input
              id="isPublished"
              v-model="postData.isPublished"
              type="checkbox"
            >
            <label for="isPublished" class="checkbox-label">
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
              <option v-for="group in availableGroups" :key="group._id" :value="group._id">
                {{ group.groupName }}
              </option>
            </select>
            <button type="button" @click="showCreateGroup = true" class="btn btn-outline">
              + Create New Group
            </button>
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
            <div class="modal-actions">
              <button @click="createNewGroup" class="btn btn-primary" :disabled="!newGroup.groupName">
                Create Group
              </button>
              <button @click="cancelCreateGroup" class="btn btn-secondary">Cancel</button>
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
                📄 Upload Markdown File (.md) *
              </span>
              <span v-else class="file-info">
                ✅ {{ markdownFile.name }} ({{ formatFileSize(markdownFile.size) }})
              </span>
            </div>
          </label>
          <span v-if="fieldErrors.postContent" class="error-text">{{ fieldErrors.postContent }}</span>
        </div>

        <!-- Markdown Preview -->
        <div v-if="postData.postContent" class="preview-section">
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

      <!-- Replace the Additional Attachments section in PostCreator.vue -->
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
          @click="resetForm"
          class="btn btn-secondary"
          :disabled="isSubmitting"
        >
          Reset
        </button>

        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="btn btn-primary"
        >
          <span v-if="isSubmitting">Creating Post...</span>
          <span v-else>Create Post</span>
        </button>
      </div>
    </form>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h2>🎉 Post Created Successfully!</h2>
        <p>Your blog post has been created and all files have been uploaded.</p>
        <div class="modal-actions">
          <button @click="createAnotherPost" class="btn btn-primary">
            Create Another Post
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
  name: 'EnhancedPostCreator',

  data() {
    return {
      postData: {
        postTitle: '',
        postAuthor: '',
        postContent: '',
        postTopics: [], // This will now contain the selected topic
        isPublished: false,
        postGroup: null
      },
      selectedTopic: '', // Single topic selection
      markdownFile: null,
      uploadedImages: [], // For sequenced images
      attachedFiles: [], // For additional attachments
      availableTopics: [],
      availableGroups: [],
      selectedGroupId: '',
      newGroup: {
        groupName: '',
        groupDescription: ''
      },
      showCreateGroup: false,
      isSubmitting: false,
      showPreview: false,
      showSuccessModal: false,
      createdPostId: null,
      errorMessage: '',
      fieldErrors: {},
      uploadProgress: 0,
      currentTask: ''
    };
  },


  computed: {
    isFormValid() {
      return (
        this.postData.postTitle.trim() &&
        this.postData.postAuthor.trim() &&
        this.postData.postContent.trim() &&
        this.selectedTopic.trim()
      );
    },

    compiledMarkdown() {
      if (!this.postData.postContent) return '';
      const rawMarkdown = marked(this.postData.postContent);
      return DOMPurify.sanitize(rawMarkdown);
    },

    hasAttachmentImages() {
      return this.attachedFiles.some(file => file.type.startsWith('image/'));
    },

    attachmentImages() {
      return this.attachedFiles.filter(file => file.type.startsWith('image/'));
    }
  },

  async mounted() {
    await this.loadTopics();
    await this.loadPostGroups();
  },

  watch: {
    selectedTopic(newTopic) {
      // Update postTopics array with the selected topic
      if (newTopic) {
        this.postData.postTopics = [newTopic];
      } else {
        this.postData.postTopics = [];
      }
      this.clearFieldError('postTopics');
    }
  },

  methods: {
    async loadTopics() {
      try {
        const response = await fetch('/api/topics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.availableTopics = await response.json();
      } catch (error) {
        console.error('Failed to load topics:', error);
        this.showError('Failed to load topics. Please check if the server is running on port 8050.');
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
        this.selectedGroupId = newGroup._id;
        this.showCreateGroup = false;
        this.newGroup = { groupName: '', groupDescription: '' };
        this.fieldErrors.groupName = '';
      } catch (error) {
        this.showError('Failed to create group: ' + error.message);
      }
    },

    cancelCreateGroup() {
      this.showCreateGroup = false;
      this.newGroup = { groupName: '', groupDescription: '' };
      this.fieldErrors.groupName = '';
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
        this.postData.postContent = e.target.result;
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

      // Validate file sizes (100MB limit for attachments - increased from 50MB)
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

    validateForm() {
      this.fieldErrors = {};

      if (!this.postData.postTitle.trim()) {
        this.fieldErrors.postTitle = 'Post title is required';
      }

      if (!this.postData.postAuthor.trim()) {
        this.fieldErrors.postAuthor = 'Author name is required';
      }

      if (!this.postData.postContent.trim()) {
        this.fieldErrors.postContent = 'Post content is required';
      }

      if (!this.selectedTopic.trim()) {
        this.fieldErrors.postTopics = 'Please select a post topic';
      }

      return Object.keys(this.fieldErrors).length === 0;
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
      }
    },

    async uploadFileToGridFS(postId, file, fileType = 'attachment', sequence = 0) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1];
            const response = await fetch(`/api/upload/${postId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                filename: file.name,
                base64Data: base64Data,
                fileType: fileType,
                sequence: sequence
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

    async submitPost() {
      if (!this.validateForm()) {
        this.showError('Please fix the form errors before submitting');
        return;
      }

      this.isSubmitting = true;
      this.uploadProgress = 0;
      this.errorMessage = '';

      try {
        // Prepare post data with group information
        const postData = { ...this.postData };

        if (this.selectedGroupId) {
          const selectedGroup = this.availableGroups.find(g => g._id === this.selectedGroupId);
          postData.postGroup = {
            groupId: this.selectedGroupId,
            groupName: selectedGroup.groupName,
            sequence: 0
          };
        }

        // 1. Create the post first
        this.currentTask = 'Creating post...';
        this.uploadProgress = 10;

        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });

        if (!postResponse.ok) {
          const errorText = await postResponse.text();
          let errorMessage = 'Failed to create post';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const createdPost = await postResponse.json();
        this.createdPostId = createdPost.postId;
        this.uploadProgress = 30;

        // 2. Upload sequenced images
        if (this.uploadedImages.length > 0) {
          this.currentTask = 'Uploading sequenced images...';
          const imageCount = this.uploadedImages.length;

          for (let i = 0; i < this.uploadedImages.length; i++) {
            const image = this.uploadedImages[i];
            this.currentTask = `Uploading sequenced image ${i + 1} of ${imageCount}...`;

            await this.uploadFileToGridFS(
              createdPost.postId,
              image.file,
              'image',
              image.sequence
            );

            this.uploadProgress = 30 + (i / imageCount) * 30;
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

            await this.uploadFileToGridFS(createdPost.postId, file, fileType);

            this.uploadProgress = 60 + (i / attachmentCount) * 35;
          }
        }

        this.uploadProgress = 100;
        this.currentTask = 'Finalizing...';

        // 4. Show success modal
        setTimeout(() => {
          this.showSuccessModal = true;
          this.isSubmitting = false;
        }, 500);

      } catch (error) {
        console.error('Error creating post:', error);
        this.showError(`Failed to create post: ${error.message}`);
        this.isSubmitting = false;
      }
    },

    showError(message) {
      this.errorMessage = message;
      // Auto-hide error after 10 seconds
      setTimeout(() => {
        this.clearError();
      }, 10000);
    },

    clearError() {
      this.errorMessage = '';
    },

    resetForm() {
      if (!confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
        return;
      }

      this.postData = {
        postTitle: '',
        postAuthor: '',
        postContent: '',
        postTopics: [],
        isPublished: false,
        postGroup: null
      };
      this.selectedTopic = '';
      this.markdownFile = null;
      this.uploadedImages = [];
      this.attachedFiles = [];
      this.selectedGroupId = '';
      this.showPreview = false;
      this.errorMessage = '';
      this.fieldErrors = {};
    },

    createAnotherPost() {
      this.showSuccessModal = false;
      this.resetForm();
      this.createdPostId = null;
    },

    viewPost() {
      if (this.createdPostId) {
        // Navigate to the post view page
        this.$router.push(`/post/${this.createdPostId}`);
      }
      this.showSuccessModal = false;
    }
  },

  beforeUnmount() {
    // Clean up object URLs to prevent memory leaks
    this.uploadedImages.forEach(image => {
      if (image.file.type.startsWith('image/')) {
        URL.revokeObjectURL(this.getImagePreview(image.file));
      }
    });
  }
};
</script>

<style scoped>
/* Add these additional styles for the topic selection */
.selected-topic-display {
  margin-top: 10px;
}

.topic-tag {
  display: inline-block;
  padding: 8px 16px;
  border: 2px solid;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Keep all the existing styles from the previous component */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
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

.upload-progress {
  margin: 20px 0;
}

.progress-bar {
  background: #f0f0f0;
  border-radius: 10px;
  height: 10px;
  margin-bottom: 10px;
}

.progress-fill {
  background: #007bff;
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.current-task {
  font-style: italic;
  color: #666;
  margin-top: 10px;
}

.error-alert {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.error-content h3 {
  color: #c00;
  margin-bottom: 8px;
}

.form-input.error {
  border-color: #c00;
}

.error-text {
  color: #c00;
  font-size: 14px;
  margin-top: 5px;
  display: block;
}

.group-selection {
  display: flex;
  gap: 10px;
  align-items: center;
}

.group-selection select {
  flex: 1;
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

.image-sequence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.sequence-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.sequence-number {
  font-weight: bold;
  margin-bottom: 8px;
  color: #007bff;
}

.sequence-preview {
  max-width: 100%;
  height: 100px;
  object-fit: contain;
  margin-bottom: 8px;
}

.file-list {
  margin-top: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
}

.remove-btn:hover {
  color: #c00;
}

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
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.file-upload-label {
  display: block;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.upload-box:hover {
  border-color: #007bff;
}

.upload-box.has-file {
  border-color: #28a745;
  background: #f8fff9;
}

.upload-box.error {
  border-color: #c00;
  background: #fee;
}

.upload-box.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

/* Add these styles to the existing CSS */
.file-type-badge {
  background: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.image-previews {
  margin-top: 20px;
}

.image-previews h3 {
  margin-bottom: 15px;
  color: #333;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.image-preview-item {
  text-align: center;
}

.preview-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e1e5e9;
}

.image-name {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  word-break: break-all;
}
</style>
