<!-- [file name]: BlogPostCreator.vue -->
<template>
  <div class="blog-post-creator">
    <div class="creator-header">
      <h1>Create New Blog Post</h1>
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
          >
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
          >
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
            <div class="upload-box" :class="{ 'has-file': markdownFile }">
              <span v-if="!markdownFile" class="upload-placeholder">
                📄 Upload Markdown File (.md)
              </span>
              <span v-else class="file-info">
                ✅ {{ markdownFile.name }} ({{ formatFileSize(markdownFile.size) }})
              </span>
            </div>
          </label>
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

      <!-- File Attachments -->
      <div class="form-section">
        <h2>Attachments (Optional)</h2>
        <p class="section-description">
          You can upload up to 10 images, GIFs, or other files.
          Maximum file size: 50MB per file.
        </p>

        <!-- File Upload Area -->
        <div class="file-upload-area">
          <label class="file-upload-label">
            <input
              type="file"
              multiple
              accept="image/*,.gif,.pdf,.doc,.docx,.zip"
              @change="handleFileUpload"
              :disabled="attachedFiles.length >= 10"
              class="file-input"
            >
            <div class="upload-box" :class="{ 'disabled': attachedFiles.length >= 10 }">
              <span class="upload-placeholder">
                📎 Add Files ({{ attachedFiles.length }}/10)
              </span>
            </div>
          </label>
        </div>

        <!-- File List -->
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
              </div>
            </div>

            <div class="file-actions">
              <button
                type="button"
                @click="removeFile(index)"
                class="remove-btn"
                title="Remove file"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Image Preview Grid -->
        <div v-if="hasImages" class="image-previews">
          <h3>Image Previews</h3>
          <div class="image-grid">
            <div
              v-for="(file, index) in imageFiles"
              :key="index"
              class="image-preview-item"
            >
              <img :src="getImagePreview(file)" :alt="file.name" class="preview-image">
              <span class="image-name">{{ file.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Topics Selection -->
      <div class="form-section">
        <h2>Post Topics</h2>
        <div class="topics-selection">
          <div
            v-for="topic in availableTopics"
            :key="topic.topicName"
            class="topic-tag"
            :class="{ 'selected': postData.postTopics.includes(topic.topicName) }"
            @click="toggleTopic(topic.topicName)"
            :style="{ backgroundColor: topic.topicColor + '20', borderColor: topic.topicColor }"
          >
            {{ topic.topicName }}
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
        <p>Your blog post has been created and files have been uploaded.</p>
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
  name: 'BlogPostCreator',

  data() {
    return {
      postData: {
        postTitle: '',
        postAuthor: '',
        postContent: '',
        postTopics: [],
        isPublished: false
      },
      markdownFile: null,
      attachedFiles: [],
      availableTopics: [],
      isSubmitting: false,
      showPreview: false,
      showSuccessModal: false,
      createdPostId: null
    };
  },

  computed: {
    isFormValid() {
      return (
        this.postData.postTitle.trim() &&
        this.postData.postAuthor.trim() &&
        this.postData.postContent.trim()
      );
    },

    compiledMarkdown() {
      if (!this.postData.postContent) return '';
      const rawMarkdown = marked(this.postData.postContent);
      return DOMPurify.sanitize(rawMarkdown);
    },

    hasImages() {
      return this.attachedFiles.some(file => file.type.startsWith('image/'));
    },

    imageFiles() {
      return this.attachedFiles.filter(file => file.type.startsWith('image/'));
    }
  },

  async mounted() {
  // Test server connection
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        console.log('✅ Server connection successful');
      } else {
        console.error('❌ Server connection failed');
      }
    } catch (error) {
      console.error('❌ Cannot reach server:', error);
      alert('Cannot connect to server. Make sure the backend is running on port 8050.');
    }

    await this.loadTopics();
  },

  methods: {
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

    handleMarkdownUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith('.md') && !file.type.includes('text/')) {
        alert('Please upload a valid Markdown file (.md)');
        return;
      }

      this.markdownFile = file;
      this.readMarkdownFile(file);
    },

    readMarkdownFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.postData.postContent = e.target.result;
      };
      reader.onerror = () => {
        alert('Error reading markdown file');
      };
      reader.readAsText(file);
    },

    handleFileUpload(event) {
      const files = Array.from(event.target.files);
      const remainingSlots = 10 - this.attachedFiles.length;

      if (files.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more files.`);
        return;
      }

      // Validate file sizes (50MB limit)
      const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert('Some files exceed the 50MB size limit');
        return;
      }

      this.attachedFiles.push(...files);
      event.target.value = ''; // Reset file input
    },

    removeFile(index) {
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

    toggleTopic(topicName) {
      const index = this.postData.postTopics.indexOf(topicName);
      if (index > -1) {
        this.postData.postTopics.splice(index, 1);
      } else {
        this.postData.postTopics.push(topicName);
      }
    },

    async uploadFileToGridFS(postId, file) {
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
                base64Data: base64Data
              })
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
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
      if (!this.isFormValid) return;

      this.isSubmitting = true;

      try {
        // 1. Create the post first
        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.postData)
        });

        if (!postResponse.ok) {
          throw new Error('Failed to create post');
        }

        const createdPost = await postResponse.json();
        this.createdPostId = createdPost.postId;

        // 2. Upload attached files to GridFS
        if (this.attachedFiles.length > 0) {
          const uploadPromises = this.attachedFiles.map(file =>
            this.uploadFileToGridFS(createdPost.postId, file)
          );

          await Promise.all(uploadPromises);
        }

        // 3. Show success modal
        this.showSuccessModal = true;

      } catch (error) {
        console.error('Error creating post:', error);
        alert(`Failed to create post: ${error.message}`);
      } finally {
        this.isSubmitting = false;
      }
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
        isPublished: false
      };
      this.markdownFile = null;
      this.attachedFiles = [];
      this.showPreview = false;
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
    this.attachedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        URL.revokeObjectURL(this.getImagePreview(file));
      }
    });
  }
};
</script>

<style scoped>
.blog-post-creator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.creator-header {
  text-align: center;
  margin-bottom: 30px;
}

.creator-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.form-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  margin-bottom: 16px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
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

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
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

.file-upload-label {
  cursor: pointer;
  display: block;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.upload-box:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.upload-box.has-file {
  border-color: #10b981;
  background-color: #f0fff4;
}

.upload-box.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-placeholder {
  color: #6b7280;
  font-size: 16px;
}

.file-info {
  color: #059669;
  font-weight: 500;
}

.preview-section {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-toggle {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.preview-content {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 20px;
  background: #fafafa;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-preview {
  line-height: 1.6;
}

.section-description {
  color: #6b7280;
  margin-bottom: 16px;
  font-size: 14px;
}

.file-list {
  margin-top: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fafafa;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-details {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #6b7280;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.image-previews {
  margin-top: 20px;
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

.topics-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  padding: 8px 16px;
  border: 2px solid;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
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

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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
  padding: 32px;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content h2 {
  color: #059669;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}
</style>
