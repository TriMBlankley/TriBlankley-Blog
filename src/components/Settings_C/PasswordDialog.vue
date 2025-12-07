<template>
  <div class="password-dialog-overlay">
    <div class="password-dialog">
      <div class="dialog-header">
        <h3>Authentication Required</h3>
        <button @click="handleCancel" class="close-btn" aria-label="Close">
          ×
        </button>
      </div>

      <div class="dialog-content">
        <p>Enter the administrator password to access this section:</p>

        <div class="password-input-group">
          <input
            type="password"
            v-model="password"
            @keyup.enter="handleSubmit"
            placeholder="Enter password"
            class="password-input"
            :class="{ 'error': showError }"
          />
          <button @click="handleSubmit" class="submit-btn" :disabled="!password">
            Submit
          </button>
        </div>

        <div v-if="showError" class="error-message">
          Incorrect password. Please try again.
        </div>

        <div v-if="isLoading" class="loading-message">
          Verifying...
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="handleCancel" class="cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const password = ref('');
const showError = ref(false);
const isLoading = ref(false);


const handleSubmit = async () => {
  if (!password.value.trim()) return;

  isLoading.value = true;
  showError.value = false;

  try {
    const response = await fetch('/api/verify-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: password.value })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.valid) {
        // Store the session token in localStorage
        if (result.sessionToken) {
          localStorage.setItem('settingsSessionToken', result.sessionToken);
        }
        emit('success');
      } else {
        showError.value = true;
        password.value = '';
      }
    } else {
      showError.value = true;
      password.value = '';
    }
  } catch (error) {
    console.error('Password verification error:', error);
    showError.value = true;
    password.value = '';
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.password-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.password-dialog {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
}

.dialog-content {
  padding: 24px;
}

.dialog-content p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.password-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.password-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.password-input:focus {
  outline: none;
  border-color: #007bff;
}

.password-input.error {
  border-color: #dc3545;
}

.submit-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 13px;
  margin-bottom: 8px;
}

.loading-message {
  color: #666;
  font-size: 13px;
  font-style: italic;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background: #545b62;
}
</style>
