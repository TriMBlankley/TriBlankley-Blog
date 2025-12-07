<!-- [file name]: PostCreator.vue -->
<script>

const getSessionToken = () => {
  return localStorage.getItem('settingsSessionToken');
}

export default {
  name: 'EnhancedPostCreator',

  data() {
    return {
      postData: {
        postTitle: '',
        postAuthor: [], // CHANGED: Now an array for multiple authors
        postContent: '',
        postTopics: [],
        contentType: 'Text',
        isPublished: false,
        showGalleryView: false, // NEW: Gallery view checkbox
        isNSFW: false,
        postGroup: null
      },
      selectedTopic: '',
      currentAuthor: '', // NEW: Temporary input for adding authors
      markdownFile: null,
      sequencedAttachments: [],
      attachedFiles: [],
      availableTopics: [],
      availableGroups: [],
      selectedGroupId: '',
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
        this.postData.postAuthor.length > 0 && // CHANGED: Check if authors array has at least one
        this.postData.postContent.trim() &&
        this.selectedTopic.trim() &&
        this.postData.contentType.trim()
      );
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

  async mounted() {
    await this.loadTopics();
    await this.loadPostGroups();
  },

  watch: {
    selectedTopic(newTopic) {
      if (newTopic) {
        this.postData.postTopics = [newTopic];
      } else {
        this.postData.postTopics = [];
      }
      this.clearFieldError('postTopics');
    }
  },

  methods: {
    // NEW: Add author to the list
    addAuthor() {
      if (this.currentAuthor.trim() && !this.postData.postAuthor.includes(this.currentAuthor.trim())) {
        this.postData.postAuthor.push(this.currentAuthor.trim());
        this.currentAuthor = '';
        this.clearFieldError('postAuthor');
      }
    },

    // NEW: Remove author from the list
    removeAuthor(index) {
      this.postData.postAuthor.splice(index, 1);
    },

    // NEW: Handle Enter key in author input
    handleAuthorKeypress(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.addAuthor();
      }
    },

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
        const sessionToken = getSessionToken() || ''; // Provide empty string as default
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
        this.postData.postContent = e.target.result;
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

    removeAttachment(index) {
      this.attachedFiles.splice(index, 1);
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

      // CHANGED: Validate authors array
      if (this.postData.postAuthor.length === 0) {
        this.fieldErrors.postAuthor = 'At least one author is required';
      }

      if (!this.postData.postContent.trim()) {
        this.fieldErrors.postContent = 'Post content is required';
      }

      if (!this.selectedTopic.trim()) {
        this.fieldErrors.postTopics = 'Please select a post topic';
      }

      if (!this.postData.contentType.trim()) {
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
            const sessionToken = getSessionToken() || ''; // Provide empty string as default
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
                attachmentType: attachmentType // Pass the attachment type
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
            groupColor: selectedGroup.groupColor,
            sequence: 0
          };
        }

        // 1. Create the post first
        this.currentTask = 'Creating post...';
        this.uploadProgress = 10;

        const sessionToken = getSessionToken() || ''; // Provide empty string as default
        const postResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
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

        // 2. Upload sequenced attachments (images, audio, video)
        if (this.sequencedAttachments.length > 0) {
          this.currentTask = 'Uploading sequenced attachments...';
          const attachmentCount = this.sequencedAttachments.length;

          for (let i = 0; i < this.sequencedAttachments.length; i++) {
            const attachment = this.sequencedAttachments[i];
            this.currentTask = `Uploading sequenced ${attachment.attachmentType} ${i + 1} of ${attachmentCount}...`;

            await this.uploadFileToGridFS(
              createdPost.postId,
              attachment.file,
              'in-text', // Keep as 'image' for GridFS compatibility
              attachment.sequence,
              attachment.attachmentType // Pass the detected attachment type
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

    showError(message, type = 'error') {
      if (type === 'success') {
        console.log('Success:', message);
        this.errorMessage = '';
        return;
      }

      this.errorMessage = message;
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
        postAuthor: [], // CHANGED: Reset to empty array
        postContent: '',
        postTopics: [],
        contentType: 'Text',
        isPublished: false,
        showGalleryView: false, // NEW: Reset gallery view
        isNSFW: false,
        postGroup: null
      };
      this.currentAuthor = ''; // NEW: Reset current author input
      this.selectedTopic = '';
      this.markdownFile = null;
      this.sequencedAttachments = [];
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
        this.$router.push(`/BlogPage/${this.createdPostId}`);
      }
      this.showSuccessModal = false;
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
          <input id="postTitle" v-model="postData.postTitle" type="text" required placeholder="Enter post title"
            class="form-input" :class="{ 'error': fieldErrors.postTitle }">
          <span v-if="fieldErrors.postTitle" class="error-text">{{ fieldErrors.postTitle }}</span>
        </div>

        <!-- Post Authors -->
        <div class="form-group">
          <label for="postAuthor">Authors *</label>
          <div class="authors-input-container">
            <div class="author-input-group">
              <input id="postAuthor" v-model="currentAuthor" type="text" placeholder="Enter author name and press Enter"
                class="form-input" :class="{ 'error': fieldErrors.postAuthor }" @keypress="handleAuthorKeypress">
              <button type="button" @click="addAuthor" class="btn btn-outline add-author-btn">
                Add
              </button>
            </div>
            <span v-if="fieldErrors.postAuthor" class="error-text">{{ fieldErrors.postAuthor }}</span>

            <!-- Authors List -->
            <div v-if="postData.postAuthor.length > 0" class="authors-list">
              <div v-for="(author, index) in postData.postAuthor" :key="index" class="author-tag">
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
          <label for="contentType">Content Type *</label>
          <select id="contentType" v-model="postData.contentType" class="form-input"
            :class="{ 'error': fieldErrors.contentType }" required>
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
          <label for="isPublished">Publish Status</label>
          <div class="checkbox-group">
            <input id="isPublished" v-model="postData.isPublished" type="checkbox">
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
          <select v-model="selectedTopic" class="form-input" :class="{ 'error': fieldErrors.postTopics }" required>
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
              <option v-for="group in availableGroups" :key="group._id" :value="group._id"
                :style="{ color: group.groupColor }">
                {{ group.groupName }}
              </option>
            </select>
            <button type="button" @click="showCreateGroup = true" class="btn btn-outline">
              + Create New Group
            </button>
            <button v-if="selectedGroupId" type="button" @click="editSelectedGroup" class="btn btn-outline">
              ✏️ Edit Group
            </button>
          </div>
        </div>

        <!-- Selected group display with color -->
        <div v-if="selectedGroup" class="selected-group-display">
          <span class="group-tag" :style="{
            backgroundColor: selectedGroup.groupColor + '20',
            borderColor: selectedGroup.groupColor,
            color: selectedGroup.groupColor
          }">
            {{ selectedGroup.groupName }}
          </span>
        </div>

        <!-- Create New Group Modal -->
        <div v-if="showCreateGroup" class="modal-overlay">
          <div class="modal-content">
            <h3>Create New Post Group</h3>
            <div class="form-group">
              <label>Group Name *</label>
              <input v-model="newGroup.groupName" type="text" class="form-input" placeholder="Enter group name"
                :class="{ 'error': fieldErrors.groupName }">
              <span v-if="fieldErrors.groupName" class="error-text">{{ fieldErrors.groupName }}</span>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="newGroup.groupDescription" class="form-input"
                placeholder="Optional description"></textarea>
            </div>
            <div class="form-group">
              <label>Group Color</label>
              <div class="color-picker-container">
                <input v-model="newGroup.groupColor" type="color" class="color-picker">
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
              <input v-model="editingGroup.groupName" type="text" class="form-input" placeholder="Enter group name"
                :class="{ 'error': fieldErrors.editingGroupName }">
              <span v-if="fieldErrors.editingGroupName" class="error-text">{{ fieldErrors.editingGroupName }}</span>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="editingGroup.groupDescription" class="form-input"
                placeholder="Optional description"></textarea>
            </div>
            <div class="form-group">
              <label>Group Color</label>
              <div class="color-picker-container">
                <input v-model="editingGroup.groupColor" type="color" class="color-picker">
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
            <input type="file" accept=".md,.txt" @change="handleMarkdownUpload" class="file-input">
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
      </div>

      <!-- Sequenced Attachments (REPLACES Images for Sequencing) -->
      <div class="form-section">
        <h2>Sequenced Attachments</h2>
        <p class="section-description">
          Upload images, audio, or video files that will be referenced in your markdown as Image 1, Audio 1, Video 1,
          etc.
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

                <!-- NEW: Attachment Type Display and Selector -->
                <div class="attachment-type-selector">
                  <label>Type:</label>
                  <select :value="attachment.attachmentType" @change="updateAttachmentType(index, $event.target.value)"
                    class="type-select">
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <!-- NEW: Type Badge Display -->
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

        <div class="form-group">
          <label for="showGalleryView">Gallery View</label>
          <div class="checkbox-group">
            <input id="showGalleryView" v-model="postData.showGalleryView" type="checkbox">
            <label for="showGalleryView" class="checkbox-label">
              Show Gallery View?
            </label>
          </div>
          <p class="field-description">When enabled, this post will display in a gallery format instead of the standard
            blog view.</p>
        </div>
      </div>

      <div class="form-section">
        <h2>Additional Options</h2>

        <div class="form-group">
          <label for="isNSFW">Is NSFW</label>
          <div class="checkbox-group">
            <input id="isNSFW" v-model="postData.isNSFW" type="checkbox">
            <label for="isNSFW" class="checkbox-label">
              Is post NSFW?
            </label>
          </div>
          <p class="field-description">
            When checked, the post will not display on the gloabal blog, only on the NSFW mirror.
          </p>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="btn btn-secondary" :disabled="isSubmitting">
          Reset Form
        </button>
        <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isSubmitting">
          {{ isSubmitting ? 'Creating Post...' : 'Create Post' }}
        </button>
      </div>
    </form>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content success-modal">
        <div class="success-icon">✅</div>
        <h3>Post Created Successfully!</h3>
        <p>Your blog post has been created and files have been uploaded.</p>
        <div class="success-actions">
          <button @click="createAnotherPost" class="btn btn-outline">
            Create Another Post
          </button>
          <button @click="viewPost" class="btn btn-primary">
            View Post
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-post-creator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.creator-header {
  text-align: center;
  margin-bottom: 30px;
}

.creator-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.form-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.4rem;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.section-description {
  color: #666;
  margin-bottom: 15px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-input.error {
  border-color: #dc3545;
}

.error-text {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
  display: block;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-label {
  margin-bottom: 0;
  font-weight: normal;
  cursor: pointer;
}

.selected-topic-display,
.selected-group-display {
  margin-top: 15px;
}

.topic-tag,
.group-tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 2px solid;
}

.group-selection {
  display: flex;
  gap: 10px;
  align-items: center;
}

.group-selection .form-input {
  flex: 1;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-outline {
  background-color: transparent;
  border: 2px solid #007bff;
  color: #007bff;
}

.btn-outline:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-upload-area {
  margin-bottom: 20px;
}

.file-upload-label {
  cursor: pointer;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed #007bff;
  border-radius: 6px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.upload-box:hover:not(.disabled) {
  background-color: #e9ecef;
}

.upload-box.has-file {
  border-color: #28a745;
  background-color: #d4edda;
}

.upload-box.disabled {
  border-color: #6c757d;
  background-color: #e9ecef;
  cursor: not-allowed;
}

.upload-placeholder {
  color: #007bff;
  font-weight: 500;
}

.upload-box.has-file .upload-placeholder {
  color: #28a745;
}

.upload-box.disabled .upload-placeholder {
  color: #6c757d;
}

.file-info {
  color: #28a745;
  font-weight: 500;
}

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

.attachment-icon {
  font-size: 1.2rem;
}

.attachment-name {
  font-weight: 500;
  color: #333;
}

.attachment-sequence {
  background-color: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
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

.attachment-type-select {
  padding: 2px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
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

.preview-section {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-toggle {
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.preview-toggle:hover {
  background-color: #007bff;
  color: white;
}

.preview-content {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  background-color: white;
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
  background-color: #f4f4f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown-preview pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-preview pre code {
  background: none;
  padding: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.success-modal {
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 50px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #666;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.loading-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.upload-progress {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.current-task {
  color: #666;
  font-style: italic;
  margin-top: 10px;
}

.error-alert {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  color: #721c24;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #721c24;
}

@media (max-width: 768px) {
  .blog-post-creator {
    padding: 10px;
  }

  .form-section {
    padding: 15px;
  }

  .group-selection {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .modal-actions,
  .success-actions {
    flex-direction: column;
  }
}

/* Add these new styles for the multiple authors feature */
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

/* Add styles for the gallery view checkbox */
.field-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 5px;
  font-style: italic;
}

/* Add styles for sequenced attachment type features */
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

/* Update the sequenced attachment item to accommodate the type badge */
.attachment-item.sequenced .attachment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
