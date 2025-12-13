<template>
  <div class="password-dialog-overlay" @click.self="handleCancel">
    <div class="password-dialog">
      <div class="dialog-header">
        <h3>Authentication Required</h3>
        <XButton @close="handleCancel" aria-label="Close password diologue" />
      </div>

      <div class="h-rule"></div>

      <div class="dialog-content">
        <p>Enter the administrator password to access this section:</p>

        <div class="password-input-group">
          <input
            type="password"
            v-model="password"
            @keyup.enter="handleSubmit"
            placeholder="Enter password"
            class="text-input"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import XButton from '@/components/XButton.vue';

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
    background-color: color-mix(in oklab, var(--background), transparent 33%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
}

.password-dialog {
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  height: 275px;
  border: 5px solid;
  border-color: var(--text);
  background-color: var(--background);
}

.dialog-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}


.dialog-content {
  padding: 24px;
}

.dialog-content p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.password-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}


.password-input:focus {
  outline: none;
  border-color: var(--ac-blue);
}

.password-input.error {
  border-color: var(--ac-red);
}

.submit-btn {
  padding: 10px 20px;
  background: var(--ac-blue);
  /* color: white; */
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--background), var(--ac-blue) 66%);;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--ac-red);
  font-size: 13px;
  margin-bottom: 8px;
}

.loading-message {
  font-size: 13px;
  font-style: italic;
}
</style>
