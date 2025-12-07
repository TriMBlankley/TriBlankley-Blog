<template>
  <div class="change-password">
    <div class="change-password-container">
      <div class="change-password-header">
        <h2 class="responsive-h2">Change Administrator Password</h2>
        <p class="description text-base">
          Change the password required to access blog settings and make changes.
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="success-message">
        <div class="success-content">
          <div class="success-icon">✅</div>
          <h3 class="responsive-h3">Password Changed Successfully!</h3>
          <p class="text-base">Your password has been updated. You'll need to use the new password to access protected settings.</p>
          <button @click="closeSuccess" class="btn btn-primary">
            Continue
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <h3 class="responsive-h3">❌ Error</h3>
          <p class="text-base">{{ errorMessage }}</p>
          <button @click="clearError" class="btn btn-secondary">
            Dismiss
          </button>
        </div>
      </div>

      <!-- Password Form -->
      <form v-if="!showSuccessMessage" @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label for="currentPassword" class="form-label text-base">
            Current Password *
          </label>
          <div class="password-input-container">
            <input
              id="currentPassword"
              v-model="form.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              placeholder="Enter current password"
              class="form-input"
              :class="{ 'error': fieldErrors.currentPassword }"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="toggle-password-btn"
              :title="showCurrentPassword ? 'Hide password' : 'Show password'"
            >
              {{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="fieldErrors.currentPassword" class="error-text text-sm">
            {{ fieldErrors.currentPassword }}
          </span>
        </div>

        <div class="form-group">
          <label for="newPassword" class="form-label text-base">
            New Password *
          </label>
          <div class="password-input-container">
            <input
              id="newPassword"
              v-model="form.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Enter new password"
              class="form-input"
              :class="{ 'error': fieldErrors.newPassword }"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="toggle-password-btn"
              :title="showNewPassword ? 'Hide password' : 'Show password'"
            >
              {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="fieldErrors.newPassword" class="error-text text-sm">
            {{ fieldErrors.newPassword }}
          </span>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label text-base">
            Confirm New Password *
          </label>
          <div class="password-input-container">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm new password"
              class="form-input"
              :class="{ 'error': fieldErrors.confirmPassword || passwordsMatch === false }"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="toggle-password-btn"
              :title="showConfirmPassword ? 'Hide password' : 'Show password'"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="fieldErrors.confirmPassword" class="error-text text-sm">
            {{ fieldErrors.confirmPassword }}
          </span>
          <span v-if="passwordsMatch === false" class="error-text text-sm">
            Passwords do not match
          </span>
          <span v-if="passwordsMatch === true" class="success-text text-sm">
            ✓ Passwords match
          </span>
        </div>

        <!-- Session Management -->
        <div class="session-management">
          <div class="checkbox-group">
            <input
              id="invalidateSessions"
              v-model="form.invalidateSessions"
              type="checkbox"
              class="checkbox-input"
            />
            <label for="invalidateSessions" class="checkbox-label text-base">
              Invalidate all existing sessions
            </label>
          </div>
          <p class="field-description text-sm">
            When enabled, all active sessions will be terminated immediately. Users will need to log in again.
          </p>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            @click="handleCancel"
            class="btn btn-secondary"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isFormValid || isSubmitting"
          >
            <span v-if="isSubmitting">
              <span class="spinner"></span> Changing Password...
            </span>
            <span v-else>
              Change Password
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  invalidateSessions: boolean;
}

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const form = ref<FormData>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  invalidateSessions: true
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const showSuccessMessage = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);
const fieldErrors = ref<Record<string, string>>({});

// Computed properties
const passwordsMatch = computed(() => {
  if (!form.value.newPassword || !form.value.confirmPassword) return null;
  return form.value.newPassword === form.value.confirmPassword;
});

const isFormValid = computed(() => {
  return (
    form.value.currentPassword.trim() &&
    form.value.newPassword.trim() &&
    form.value.confirmPassword.trim() &&
    form.value.newPassword.length >= 1 &&
    passwordsMatch.value === true
  );
});

// Methods
const validateForm = () => {
  fieldErrors.value = {};

  if (!form.value.currentPassword.trim()) {
    fieldErrors.value.currentPassword = 'Current password is required';
  }

  if (!form.value.newPassword.trim()) {
    fieldErrors.value.newPassword = 'New password is required';
  } else if (form.value.newPassword.length < 1) {
    fieldErrors.value.newPassword = 'Password is required';
  }

  if (!form.value.confirmPassword.trim()) {
    fieldErrors.value.confirmPassword = 'Please confirm your new password';
  }

  return Object.keys(fieldErrors.value).length === 0;
};

const getSessionToken = () => {
  return localStorage.getItem('settingsSessionToken');
};

const handleSubmit = async () => {
  if (!validateForm()) {
    errorMessage.value = 'Please fix the form errors before submitting';
    return;
  }

  if (passwordsMatch.value === false) {
    errorMessage.value = 'New passwords do not match';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': getSessionToken() || ''
      },
      body: JSON.stringify({
        currentPassword: form.value.currentPassword,
        newPassword: form.value.newPassword,
        invalidateSessions: form.value.invalidateSessions
      })
    });

    // First, check if we got a response at all
    if (!response.ok) {
      // Try to get the response as text first
      const errorText = await response.text();

      // Try to parse it as JSON if it looks like JSON
      let errorMessageText = `Server error: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessageText = errorData.error || errorMessageText;
      } catch {
        // If it's not JSON, use the raw text
        if (errorText && errorText.trim()) {
          errorMessageText = errorText;
        }
      }

      throw new Error(errorMessageText);
    }

    // Try to parse the successful response
    const data = await response.json().catch(async () => {
      // If JSON parsing fails, try to get text
      const text = await response.text();
      throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
    });

    // Clear session token if sessions were invalidated
    if (form.value.invalidateSessions) {
      localStorage.removeItem('settingsSessionToken');
    }

    showSuccessMessage.value = true;
  } catch (error) {
    console.error('Password change error:', error);
    if (error instanceof SyntaxError) {
      errorMessage.value = 'Server returned an invalid response. Please check if the server is running correctly.';
    } else if (error instanceof TypeError) {
      errorMessage.value = 'Network error. Please check your connection and try again.';
    } else {
      errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
};

const closeSuccess = () => {
  showSuccessMessage.value = false;
  emit('success');
};

const clearError = () => {
  errorMessage.value = '';
};
</script>

<style scoped>
.change-password {
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.change-password-container {
  max-width: 600px;
  margin: 0 auto;
  background: var(--background);
  padding: 30px;
  border-radius: 8px;
  border: 1px solid var(--text-offset);
}

.change-password-header {
  margin-bottom: 30px;
  text-align: center;
}

.change-password-header h2 {
  margin: 0 0 10px 0;
  color: var(--text);
  font-weight: 600;
}

.description {
  margin: 0;
  color: var(--text-offset);
  line-height: 1.5;
}

/* Success Message */
.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 25px;
  text-align: center;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.success-message h3 {
  margin: 0 0 10px 0;
  color: #155724;
}

.success-message p {
  margin: 0 0 20px 0;
  color: #155724;
  line-height: 1.4;
}

/* Error Message */
.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.error-content h3 {
  margin: 0 0 10px 0;
  color: #721c24;
}

.error-content p {
  margin: 0 0 15px 0;
  color: #721c24;
  line-height: 1.4;
}

/* Form Styles */
.password-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text);
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 12px 45px 12px 12px;
  border: 2px solid var(--text-offset);
  border-radius: 6px;
  font-size: var(--font-size-base);
  transition: border-color 0.3s ease;
  font-family: 'OpenDyslexic';
  background: var(--background);
  color: var(--text);
}

.form-input:focus {
  outline: none;
  border-color: var(--ac-links);
}

.form-input.error {
  border-color: #dc3545;
}

.toggle-password-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: var(--text-offset);
}

.toggle-password-btn:hover {
  background-color: var(--mt-light-offset);
}

.error-text {
  color: #dc3545;
  margin-top: 5px;
  display: block;
}

.success-text {
  color: #28a745;
  margin-top: 5px;
  display: block;
}

/* Session Management */
.session-management {
  margin-top: 30px;
  padding: 20px;
  background-color: var(--mt-light-offset);
  border-radius: 6px;
  border: 1px solid var(--text-offset);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label {
  margin: 0;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
}

.field-description {
  margin: 0;
  color: var(--text-offset);
  line-height: 1.4;
  font-style: italic;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--text-offset);
}

/* Button Styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  font-family: 'OpenDyslexic';
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--ac-links);
  color: var(--mt-dark);
}

.btn-primary:hover:not(:disabled) {
  background: var(--ac-links-highlight);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--mt-dark-offset);
  color: var(--mt-light);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--mt-dark);
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top-color: var(--mt-dark);
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .change-password {
    padding: 10px;
  }

  .change-password-container {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
