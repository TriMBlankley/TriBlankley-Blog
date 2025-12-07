<!-- [file name]: GroupEditor.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const getSessionToken = () => {
  return localStorage.getItem('settingsSessionToken');
}

interface PostGroup {
  _id: string;
  groupName: string;
  groupDescription: string;
  groupColor: string;
  createdDate: string;
  updatedDate: string;
}

const groups = ref<PostGroup[]>([]);
const editingGroup = ref<PostGroup | null>(null);
const form = ref<PostGroup>({
  _id: '',
  groupName: '',
  groupDescription: '',
  groupColor: '#007bff',
  createdDate: '',
  updatedDate: ''
});
const isLoading = ref(false);
const errorMessage = ref('');

// Fetch groups from the API
const fetchGroups = async () => {
  try {
    isLoading.value = true;
    const response = await fetch('/api/post-groups');
    if (!response.ok) throw new Error('Failed to fetch groups');
    const data = await response.json();
    groups.value = data.sort((a: PostGroup, b: PostGroup) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  } catch (error) {
    console.error('Error in fetchGroups:', error);
    errorMessage.value = 'Failed to load groups. Please check if the server is running.';
  } finally {
    isLoading.value = false;
  }
};

// Create a new group
const createGroup = async () => {
  if (!form.value.groupName.trim()) {
    errorMessage.value = 'Group name is required';
    return;
  }

  try {
    isLoading.value = true;
    const sessionToken = getSessionToken() || ''; // Provide empty string as default
    const response = await fetch('/api/post-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        groupName: form.value.groupName,
        groupDescription: form.value.groupDescription,
        groupColor: form.value.groupColor
      })
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
    groups.value.unshift(newGroup);
    resetForm();
    errorMessage.value = '';
  } catch (error) {
    console.error('Error creating group:', error);
    errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred';
  } finally {
    isLoading.value = false;
  }
};

// Update an existing group
const updateGroup = async () => {
  if (!form.value.groupName.trim()) {
    errorMessage.value = 'Group name is required';
    return;
  }

  if (!editingGroup.value) {
    errorMessage.value = 'No group selected for editing';
    return;
  }

  try {
    isLoading.value = true;
    const response = await fetch(`/api/post-groups/${editingGroup.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupName: form.value.groupName,
        groupDescription: form.value.groupDescription,
        groupColor: form.value.groupColor
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

    // Update the group in the list
    const index = groups.value.findIndex(g => g._id === updatedGroup._id);
    if (index !== -1) {
      groups.value[index] = updatedGroup;
    }

    resetForm();
    errorMessage.value = '';
  } catch (error) {
    console.error('Error updating group:', error);
    errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred';
  } finally {
    isLoading.value = false;
  }
};

// Delete a group
const deleteGroup = async (group: PostGroup) => {
  if (!confirm(`Are you sure you want to delete the group "${group.groupName}"? Posts will keep their content but will no longer be associated with this group.`)) {
    return;
  }

  try {
    isLoading.value = true;
    const response = await fetch(`/api/post-groups/${group._id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete group');
    }

    // Remove group from the list
    groups.value = groups.value.filter(g => g._id !== group._id);

    // If we were editing this group, reset the form
    if (editingGroup.value && editingGroup.value._id === group._id) {
      resetForm();
    }

    errorMessage.value = '';
  } catch (error) {
    console.error('Error deleting group:', error);
    errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred';
  } finally {
    isLoading.value = false;
  }
};

// Edit a group
const editGroup = (group: PostGroup) => {
  form.value = { ...group };
  editingGroup.value = group;
  errorMessage.value = '';
};

// Submit form (create or update)
const submitForm = () => {
  if (editingGroup.value) {
    updateGroup();
  } else {
    createGroup();
  }
};

// Reset the form
const resetForm = () => {
  form.value = {
    _id: '',
    groupName: '',
    groupDescription: '',
    groupColor: '#007bff',
    createdDate: '',
    updatedDate: ''
  };
  editingGroup.value = null;
  errorMessage.value = '';
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Count posts in a group (you might want to implement this with an API call)
const getPostCount = async (groupId: string): Promise<number> => {
  try {
    const response = await fetch(`/api/posts/group/${groupId}`);
    if (response.ok) {
      const posts = await response.json();
      return posts.length;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching post count:', error);
    return 0;
  }
};

// Fetch groups when component mounts
onMounted(fetchGroups);
</script>

<template>
  <div class="group-editor">
    <div class="editor-container">
      <div class="editor-header">
        <h2>Post Group Management</h2>
        <p class="editor-description">
          Create and manage post groups to organize your blog posts. Groups can be assigned colors for visual identification.
        </p>
      </div>

      <!-- Error Display -->
      <div v-if="errorMessage" class="error-alert">
        <div class="error-content">
          <h3>❌ Error</h3>
          <p>{{ errorMessage }}</p>
          <button @click="errorMessage = ''" class="btn btn-secondary">Dismiss</button>
        </div>
      </div>

      <!-- Group Form -->
      <div class="group-form-section">
        <h3>{{ editingGroup ? 'Edit Group' : 'Create New Group' }}</h3>

        <div class="form-grid">
          <div class="form-group">
            <label for="groupName" class="form-label">Group Name *</label>
            <input
              id="groupName"
              v-model="form.groupName"
              type="text"
              placeholder="Enter group name"
              class="form-input"
              :class="{ 'error': !form.groupName.trim() }"
              required
            >
            <span v-if="!form.groupName.trim()" class="error-text">Group name is required</span>
          </div>

          <div class="form-group">
            <label for="groupColor" class="form-label">Group Color</label>
            <div class="color-picker-container">
              <input
                id="groupColor"
                v-model="form.groupColor"
                type="color"
                class="color-picker"
              >
              <span class="color-value">{{ form.groupColor }}</span>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="groupDescription" class="form-label">Description</label>
            <textarea
              id="groupDescription"
              v-model="form.groupDescription"
              placeholder="Optional group description"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="submitForm"
            class="btn btn-primary"
            :disabled="!form.groupName.trim() || isLoading"
          >
            <span v-if="isLoading">Processing...</span>
            <span v-else>{{ editingGroup ? 'Update Group' : 'Create Group' }}</span>
          </button>

          <button
            v-if="editingGroup"
            @click="resetForm"
            class="btn btn-secondary"
            :disabled="isLoading"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Groups List -->
      <div class="groups-list-section">
        <div class="section-header">
          <h3>Existing Groups</h3>
          <span class="group-count">{{ groups.length }} group(s)</span>
        </div>

        <div v-if="isLoading && groups.length === 0" class="loading-message">
          Loading groups...
        </div>

        <div v-else-if="groups.length === 0" class="empty-message">
          No groups created yet. Create your first group above.
        </div>

        <div v-else class="groups-grid">
          <div
            v-for="group in groups"
            :key="group._id"
            class="group-card"
            :class="{ 'editing': editingGroup && editingGroup._id === group._id }"
          >
            <div class="group-header">
              <div class="group-color-indicator" :style="{ backgroundColor: group.groupColor }"></div>
              <h4 class="group-name">{{ group.groupName }}</h4>
              <div class="group-actions">
                <button
                  @click="editGroup(group)"
                  class="btn-icon"
                  :disabled="isLoading"
                  title="Edit group"
                >
                  ✏️
                </button>
                <button
                  @click="deleteGroup(group)"
                  class="btn-icon btn-danger"
                  :disabled="isLoading"
                  title="Delete group"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="group.groupDescription" class="group-description">
              {{ group.groupDescription }}
            </div>

            <div class="group-meta">
              <span class="meta-item">
                Created: {{ formatDate(group.createdDate) }}
              </span>
              <span v-if="group.updatedDate !== group.createdDate" class="meta-item">
                Updated: {{ formatDate(group.updatedDate) }}
              </span>
              <!-- You can add post count here when implemented -->
              <!-- <span class="meta-item">
                Posts: {{ getPostCount(group._id) }}
              </span> -->
            </div>

            <div class="group-preview">
              <span
                class="group-tag-preview"
                :style="{
                  backgroundColor: group.groupColor + '20',
                  borderColor: group.groupColor,
                  color: group.groupColor
                }"
              >
                {{ group.groupName }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-editor {
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.editor-container {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.editor-header {
  margin-bottom: 30px;
  text-align: center;
}

.editor-header h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
}

.editor-description {
  margin: 0;
  color: #6c757d;
  font-size: 1.1rem;
  line-height: 1.5;
}

/* Error Alert */
.error-alert {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 25px;
}

.error-content h3 {
  color: #c00;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

/* Form Styles */
.group-form-section {
  margin-bottom: 40px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.group-form-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-input {
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
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
  font-size: 0.875rem;
  margin-top: 5px;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  width: 60px;
  height: 45px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
}

.color-value {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #6c757d;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Button Styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  transform: translateY(-1px);
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

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.btn-icon:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-icon.btn-danger:hover:not(:disabled) {
  background: #fee;
}

/* Groups List */
.groups-list-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.group-count {
  background: #e9ecef;
  color: #495057;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.group-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
}

.group-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-card.editing {
  border-color: #007bff;
  background: #f0f8ff;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.group-color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.group-name {
  margin: 0;
  flex: 1;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.group-actions {
  display: flex;
  gap: 6px;
}

.group-description {
  color: #6c757d;
  line-height: 1.5;
  margin-bottom: 15px;
  font-style: italic;
}

.group-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 15px;
}

.meta-item {
  font-size: 0.875rem;
  color: #6c757d;
}

.group-preview {
  display: flex;
  justify-content: center;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.group-tag-preview {
  display: inline-block;
  padding: 8px 16px;
  border: 2px solid;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .group-editor {
    padding: 10px;
  }

  .editor-container {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }
}
</style>
