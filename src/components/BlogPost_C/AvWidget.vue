<!-- [file name]: AvWidget.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface Props {
  audioUrl: string
  filename: string
  fileId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['download'])

const audioElement = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const audioLoaded = ref(false)
const isSeeking = ref(false)

console.log('🔊 AvWidget mounted with props:', {
  audioUrl: props.audioUrl,
  filename: props.filename,
  fileId: props.fileId
})

// Format time for display
const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formattedCurrentTime = ref('0:00')
const formattedDuration = ref('0:00')

// Update formatted times when values change
watch([currentTime, duration], () => {
  formattedCurrentTime.value = formatTime(currentTime.value)
  formattedDuration.value = formatTime(duration.value)
})

// Audio event handlers
const onLoadedMetadata = () => {
  console.log('✅ Audio metadata loaded')
  duration.value = audioElement.value?.duration || 0
  isLoading.value = false
  audioLoaded.value = true
  console.log('📊 Audio duration:', duration.value)
}

const onTimeUpdate = () => {
  if (!isSeeking.value) {
    currentTime.value = audioElement.value?.currentTime || 0
  }
}

const onPlay = () => {
  console.log('▶️ Audio started playing')
  isPlaying.value = true
}

const onPause = () => {
  console.log('⏸️ Audio paused')
  isPlaying.value = false
}

const onEnded = () => {
  console.log('⏹️ Audio ended')
  isPlaying.value = false
  currentTime.value = 0
}

const onVolumeChange = () => {
  if (audioElement.value) {
    volume.value = audioElement.value.volume
    isMuted.value = audioElement.value.muted
    console.log('🔈 Volume changed:', { volume: volume.value, muted: isMuted.value })
  }
}

const onError = (event: Event) => {
  console.error('❌ Audio error occurred:', event)
  const audio = audioElement.value
  if (audio && audio.error) {
    console.error('Audio error details:', {
      code: audio.error.code,
      message: getErrorMessage(audio.error.code),
      networkState: audio.networkState,
      readyState: audio.readyState,
      src: audio.src
    })

    // Handle specific error codes
    if (audio.error.code === MediaError.MEDIA_ERR_NETWORK) {
      console.log('🌐 Network error - retrying...')
      retry()
      return
    }
  }
  hasError.value = true
  isLoading.value = false
}

const getErrorMessage = (code: number): string => {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'The user canceled the audio.'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'A network error occurred.'
    case MediaError.MEDIA_ERR_DECODE:
      return 'The audio is corrupt or unsupported.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'The audio format is not supported.'
    default:
      return 'An unknown error occurred.'
  }
}

const onLoadStart = () => {
  console.log('🔄 Audio load started')
  isLoading.value = true
  hasError.value = false
}

const onCanPlay = () => {
  console.log('🎵 Audio can play')
  isLoading.value = false
  hasError.value = false
}

const onCanPlayThrough = () => {
  console.log('🎵 Audio can play through')
  isLoading.value = false
  hasError.value = false
}

const onWaiting = () => {
  console.log('⏳ Audio waiting/buffering')
  isLoading.value = true
}

const onStalled = () => {
  console.log('🚧 Audio stalled')
  isLoading.value = true
}

const onProgress = () => {
  if (audioElement.value) {
    const buffered = audioElement.value.buffered
    if (buffered.length > 0) {
      console.log('📊 Buffered range:', {
        start: buffered.start(0),
        end: buffered.end(0)
      })
    }
  }
}

// Control methods
const togglePlayPause = () => {
  if (!audioElement.value) {
    console.error('❌ No audio element found for play/pause')
    return
  }

  console.log('🎛️ Toggle play/pause, current state:', isPlaying.value)

  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play().catch(error => {
      console.error('❌ Error playing audio:', error)
      hasError.value = true
    })
  }
}

const safeSeek = async (newTime: number) => {
  if (!audioElement.value || !duration.value) {
    console.log('⏰ Cannot seek: no audio element or duration')
    return
  }

  // Clamp the time to valid range
  newTime = Math.max(0, Math.min(duration.value, newTime))

  console.log('⏩ Attempting to seek to:', newTime, 'seconds')

  // Store current play state
  const wasPlaying = isPlaying.value

  // Pause while seeking to avoid conflicts
  if (wasPlaying) {
    audioElement.value.pause()
  }

  isSeeking.value = true

  try {
    audioElement.value.currentTime = newTime
    currentTime.value = newTime

    // Wait a bit for the seek to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Resume playing if it was playing before
    if (wasPlaying) {
      await audioElement.value.play()
    }

    console.log('✅ Seek successful')

  } catch (error) {
    console.error('❌ Seek failed:', error)

    // If seek fails, try to recover by loading the audio again
    if (audioElement.value.readyState >= 2) { // HAVE_CURRENT_DATA or better
      console.log('🔄 Attempting recovery after seek failure')
      audioElement.value.load()
      if (wasPlaying) {
        setTimeout(() => {
          audioElement.value?.play().catch(console.error)
        }, 500)
      }
    }
  } finally {
    isSeeking.value = false
  }
}

const seek = (event: MouseEvent) => {
  if (!audioElement.value || !duration.value) {
    console.log('⏰ Cannot seek: no audio element or duration')
    return
  }

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const newTime = percent * duration.value

  console.log('⏩ Seeking to:', newTime, 'seconds (', percent * 100, '%)')
  safeSeek(newTime)
}

const setVolume = (event: MouseEvent) => {
  if (!audioElement.value) return

  const volumeSlider = event.currentTarget as HTMLElement
  const rect = volumeSlider.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const newVolume = Math.max(0, Math.min(1, percent))

  console.log('🔊 Setting volume to:', newVolume)
  audioElement.value.volume = newVolume
  volume.value = newVolume

  // Unmute if volume is set above 0
  if (newVolume > 0 && isMuted.value) {
    toggleMute()
  }
}

const toggleMute = () => {
  if (!audioElement.value) return
  console.log('🔇 Toggling mute, current:', isMuted.value)
  audioElement.value.muted = !audioElement.value.muted
  isMuted.value = audioElement.value.muted
}

const retry = () => {
  console.log('🔄 Retrying audio load')
  hasError.value = false
  isLoading.value = true
  audioLoaded.value = false
  if (audioElement.value) {
    // Reset the audio element completely
    audioElement.value.load()
  }
}

const downloadFile = () => {
  console.log('📥 Download requested for:', props.filename)
  emit('download', props.fileId, props.filename)
}

// Volume icon based on volume level
const volumeIcon = ref('🔊')
watch([volume, isMuted], () => {
  if (isMuted.value || volume.value === 0) {
    volumeIcon.value = '🔇'
  } else if (volume.value < 0.33) {
    volumeIcon.value = '🔈'
  } else if (volume.value < 0.66) {
    volumeIcon.value = '🔉'
  } else {
    volumeIcon.value = '🔊'
  }
})

// Setup event listeners when audio element is available
const setupAudioElement = () => {
  if (!audioElement.value) {
    console.error('❌ Audio element ref is still null in setupAudioElement')
    return
  }

  console.log('🎧 Audio element found, attaching event listeners')

  const audio = audioElement.value

  // Remove any existing listeners first
  audio.removeEventListener('loadedmetadata', onLoadedMetadata)
  audio.removeEventListener('timeupdate', onTimeUpdate)
  audio.removeEventListener('play', onPlay)
  audio.removeEventListener('pause', onPause)
  audio.removeEventListener('ended', onEnded)
  audio.removeEventListener('volumechange', onVolumeChange)
  audio.removeEventListener('error', onError)
  audio.removeEventListener('loadstart', onLoadStart)
  audio.removeEventListener('canplay', onCanPlay)
  audio.removeEventListener('canplaythrough', onCanPlayThrough)
  audio.removeEventListener('waiting', onWaiting)
  audio.removeEventListener('stalled', onStalled)
  audio.removeEventListener('progress', onProgress)

  // Add event listeners
  audio.addEventListener('loadedmetadata', onLoadedMetadata)
  audio.addEventListener('timeupdate', onTimeUpdate)
  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onPause)
  audio.addEventListener('ended', onEnded)
  audio.addEventListener('volumechange', onVolumeChange)
  audio.addEventListener('error', onError)
  audio.addEventListener('loadstart', onLoadStart)
  audio.addEventListener('canplay', onCanPlay)
  audio.addEventListener('canplaythrough', onCanPlayThrough)
  audio.addEventListener('waiting', onWaiting)
  audio.addEventListener('stalled', onStalled)
  audio.addEventListener('progress', onProgress)

  console.log('🔗 Event listeners attached to audio element')
  console.log('🎵 Audio source:', audio.src)

  // Check initial state
  console.log('📊 Initial audio state:', {
    readyState: audio.readyState,
    networkState: audio.networkState,
    duration: audio.duration,
    paused: audio.paused
  })

  // If audio is already loaded, update state
  if (audio.readyState >= 1) {
    console.log('⚡ Audio already has metadata')
    onLoadedMetadata()
  }
}

// Use template ref with a callback to ensure we get the element
const setAudioRef = (el: HTMLAudioElement | null) => {
  console.log('🎯 Setting audio ref:', el)
  audioElement.value = el
  if (el) {
    // Small delay to ensure the element is fully in the DOM
    setTimeout(() => {
      setupAudioElement()
    }, 10)
  }
}

// Setup when component mounts
onMounted(async () => {
  console.log('🏗️ AvWidget mounted')

  // Try multiple times to find the audio element
  const maxAttempts = 5
  let attempts = 0

  const trySetup = () => {
    attempts++
    console.log(`🔍 Attempt ${attempts} to find audio element`)

    if (audioElement.value) {
      console.log('✅ Audio element found on attempt', attempts)
      setupAudioElement()
      return
    }

    if (attempts < maxAttempts) {
      console.log('⏳ Audio element not found, retrying...')
      setTimeout(trySetup, 100)
    } else {
      console.error('❌ Failed to find audio element after', maxAttempts, 'attempts')
      hasError.value = true
      isLoading.value = false
    }
  }

  // Start trying to find the audio element
  trySetup()
})

// Watch for URL changes
watch(() => props.audioUrl, (newUrl) => {
  console.log('🔄 Audio URL changed to:', newUrl)
  if (audioElement.value) {
    audioElement.value.load()
  }
})
</script>

<template>
  <div class="audio-widget">
    <!-- Hidden audio element that's always in the DOM -->
    <audio
      :ref="setAudioRef"
      :src="audioUrl"
      preload="auto"
      class="audio-element"
      crossorigin="anonymous"
      style="display: none"
    ></audio>

    <!-- Loading State -->
    <div v-if="isLoading && !hasError" class="loading-state">
      <div class="spinner"></div>
      <p>Loading audio...</p>
      <p class="debug-info">URL: {{ audioUrl }}</p>
      <p class="debug-info">Element: {{ audioElement ? 'Found' : 'Not Found' }}</p>
      <p class="debug-info">Loaded: {{ audioLoaded ? 'Yes' : 'No' }}</p>
      <p class="debug-info" v-if="isSeeking">Seeking...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">❌</div>
      <p>Failed to load audio</p>
      <button @click="retry" class="retry-btn">Retry</button>
      <p class="debug-info">URL: {{ audioUrl }}</p>
      <p class="debug-info">Element: {{ audioElement ? 'Found' : 'Not Found' }}</p>
    </div>

    <!-- Audio Player Controls -->
    <div v-else class="audio-player">
      <div class="audio-controls">
        <!-- Play/Pause Button -->
        <button
          @click="togglePlayPause"
          class="control-btn play-pause-btn"
          :title="isPlaying ? 'Pause' : 'Play'"
          :disabled="!audioElement || !audioLoaded || isSeeking"
        >
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>

        <!-- Time Display -->
        <span class="time-display">
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </span>

        <!-- Progress Bar -->
        <div
          class="progress-bar"
          @click="seek"
          :class="{ 'disabled': !audioElement || !audioLoaded || isSeeking }"
        >
          <div class="progress-background"></div>
          <div
            class="progress-fill"
            :style="{ width: duration ? (currentTime / duration) * 100 + '%' : '0%' }"
          ></div>
          <div class="progress-thumb" :style="{ left: duration ? (currentTime / duration) * 100 + '%' : '0%' }"></div>
        </div>

        <!-- Volume Controls -->
        <div class="volume-controls">
          <button
            @click="toggleMute"
            class="control-btn volume-btn"
            :title="isMuted ? 'Unmute' : 'Mute'"
            :disabled="!audioElement || !audioLoaded || isSeeking"
          >
            {{ volumeIcon }}
          </button>
          <div
            class="volume-slider"
            @click="setVolume"
            :class="{ 'disabled': !audioElement || !audioLoaded || isSeeking }"
          >
            <div class="volume-background"></div>
            <div
              class="volume-fill"
              :style="{ width: (isMuted ? 0 : volume) * 100 + '%' }"
            ></div>
          </div>
        </div>

        <!-- Download Button -->
        <button
          @click="downloadFile"
          class="control-btn download-btn"
          title="Download"
          :disabled="isSeeking"
        >
          ⬇️
        </button>
      </div>

      <!-- Filename -->
      <div class="filename">
        {{ filename }}
        <span v-if="isSeeking" class="seeking-indicator">(seeking...)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-widget {
  background: var(--background);
  border: 2px solid color-mix(in oklab, var(--background), var(--text) 25%);
  border-radius: 10px;
  padding: 16px;
  margin: 12px 0;
  font-family: inherit;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--text);
}

.debug-info {
  font-size: 0.7rem;
  color: color-mix(in oklab, var(--text), transparent 50%);
  margin-top: 4px;
  word-break: break-all;
  text-align: center;
}

.spinner {
  border: 3px solid color-mix(in oklab, var(--background), var(--text) 20%);
  border-top: 3px solid var(--focused);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--text);
  text-align: center;
}

.error-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.retry-btn {
  background: var(--focused);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
  font-size: 0.9rem;
}

.retry-btn:hover {
  background: color-mix(in oklab, var(--focused), black 20%);
}

.audio-element {
  display: none;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.control-btn {
  background: color-mix(in oklab, var(--background), var(--text) 10%);
  border: 1px solid color-mix(in oklab, var(--background), var(--text) 25%);
  color: var(--text);
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--background), var(--focused) 20%);
  border-color: var(--focused);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.play-pause-btn {
  font-size: 1.1rem;
  min-width: 36px;
}

.volume-btn {
  font-size: 1rem;
  min-width: 32px;
}

.download-btn {
  font-size: 1rem;
  min-width: 32px;
}

.time-display {
  color: var(--text);
  font-size: 0.9rem;
  min-width: 80px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: color-mix(in oklab, var(--background), var(--text) 20%);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  margin: 0 8px;
}

.progress-bar.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 3px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--focused);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--focused);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

.volume-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-slider {
  width: 60px;
  height: 4px;
  background: color-mix(in oklab, var(--background), var(--text) 20%);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-slider.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.volume-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 2px;
}

.volume-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--focused);
  border-radius: 2px;
}

.filename {
  color: color-mix(in oklab, var(--text), transparent 30%);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 4px;
  word-break: break-word;
}

.seeking-indicator {
  color: var(--focused);
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .audio-widget {
    padding: 12px;
  }

  .audio-controls {
    gap: 8px;
  }

  .time-display {
    font-size: 0.8rem;
    min-width: 70px;
  }

  .volume-slider {
    width: 50px;
  }

  .control-btn {
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .audio-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .progress-bar {
    order: 1;
    flex: 0 0 100%;
    margin: 8px 0;
  }

  .volume-controls {
    margin-left: auto;
  }
}
</style>
