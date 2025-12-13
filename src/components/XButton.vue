<script setup lang="ts">
  import XButtonIcon from '@/assets/uiElements/xButton.svg'; // Renamed import to avoid naming conflict

  const emit = defineEmits<{
    (e: 'close'): void;
  }>();

  const handleClick = () => {
    emit('close');
  };
  </script>

  <template>
    <button class="nav-btn large-btn x-btn" @click="handleClick" aria-label="Close">
      <XButtonIcon />
    </button>
  </template>

  <style scoped>
  .x-btn {
    color: var(--ui-x-button);
  }
  </style>
