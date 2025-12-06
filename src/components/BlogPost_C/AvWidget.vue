<!-- [file name]: AvWidget.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, type VNodeRef, computed } from 'vue'  // Add computed import

interface Props {
  audioUrl?: string  // Make optional
  videoUrl?: string  // Make optional
  filename: string
  fileId: string
  fileType?: 'audio' | 'video'
}

const props = defineProps<Props>()
const emit = defineEmits(['download'])

const audioElement = ref<HTMLAudioElement | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const audioLoaded = ref(false)
const videoLoaded = ref(false)
const isSeeking = ref(false)
const isVideo = ref(props.fileType === 'video')

// Add computed property for active URL
const activeUrl = computed(() => {
  return isVideo.value ? props.videoUrl : props.audioUrl
})

console.log('🔊 AvWidget mounted with props:', {
  audioUrl: props.audioUrl,
  videoUrl: props.videoUrl,
  filename: props.filename,
  fileId: props.fileId,
  fileType: props.fileType,
  isVideo: isVideo.value,
  activeUrl: activeUrl.value
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

// Media event handlers
const onLoadedMetadata = () => {
  console.log('✅ Media metadata loaded')
  const element = isVideo.value ? videoElement.value : audioElement.value
  duration.value = element?.duration || 0
  isLoading.value = false
  if (isVideo.value) {
    videoLoaded.value = true
  } else {
    audioLoaded.value = true
  }
  console.log('📊 Media duration:', duration.value)
}

const onTimeUpdate = () => {
  if (!isSeeking.value) {
    const element = isVideo.value ? videoElement.value : audioElement.value
    currentTime.value = element?.currentTime || 0
  }
}

const onPlay = () => {
  console.log('▶️ Media started playing')
  isPlaying.value = true
}

const onPause = () => {
  console.log('⏸️ Media paused')
  isPlaying.value = false
}

const onEnded = () => {
  console.log('⏹️ Media ended')
  isPlaying.value = false
  currentTime.value = 0
}

const onVolumeChange = () => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (element) {
    volume.value = element.volume
    isMuted.value = element.muted
    console.log('🔈 Volume changed:', { volume: volume.value, muted: isMuted.value })
  }
}

const onError = (event: Event) => {
  console.error('❌ Media error occurred:', event)
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (element && (element as HTMLMediaElement).error) {
    const mediaError = (element as HTMLMediaElement).error!
    console.error('Media error details:', {
      code: mediaError.code,
      message: getErrorMessage(mediaError.code),
      networkState: element.networkState,
      readyState: element.readyState,
      src: element.src
    })

    // Handle specific error codes
    if (mediaError.code === MediaError.MEDIA_ERR_NETWORK) {
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
      return 'The user canceled the media.'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'A network error occurred.'
    case MediaError.MEDIA_ERR_DECODE:
      return 'The media is corrupt or unsupported.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'The media format is not supported.'
    default:
      return 'An unknown error occurred.'
  }
}

const onLoadStart = () => {
  console.log('🔄 Media load started')
  isLoading.value = true
  hasError.value = false
}

const onCanPlay = () => {
  console.log('🎵 Media can play')
  isLoading.value = false
  hasError.value = false
}

const onCanPlayThrough = () => {
  console.log('🎵 Media can play through')
  isLoading.value = false
  hasError.value = false
}

const onWaiting = () => {
  console.log('⏳ Media waiting/buffering')
  isLoading.value = true
}

const onStalled = () => {
  console.log('🚧 Media stalled')
  isLoading.value = true
}

const onProgress = () => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (element) {
    const buffered = element.buffered
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
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element) {
    console.error('❌ No media element found for play/pause')
    return
  }

  console.log('🎛️ Toggle play/pause, current state:', isPlaying.value)

  if (isPlaying.value) {
    element.pause()
  } else {
    element.play().catch(error => {
      console.error('❌ Error playing media:', error)
      hasError.value = true
    })
  }
}

const safeSeek = async (newTime: number) => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element || !duration.value) {
    console.log('⏰ Cannot seek: no media element or duration')
    return
  }

  // Clamp the time to valid range
  newTime = Math.max(0, Math.min(duration.value, newTime))

  console.log('⏩ Attempting to seek to:', newTime, 'seconds')

  // Store current play state
  const wasPlaying = isPlaying.value

  // Pause while seeking to avoid conflicts
  if (wasPlaying) {
    element.pause()
  }

  isSeeking.value = true

  try {
    element.currentTime = newTime
    currentTime.value = newTime

    // Wait a bit for the seek to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Resume playing if it was playing before
    if (wasPlaying) {
      await element.play()
    }

    console.log('✅ Seek successful')

  } catch (error) {
    console.error('❌ Seek failed:', error)

    // If seek fails, try to recover by loading the media again
    if (element.readyState >= 2) { // HAVE_CURRENT_DATA or better
      console.log('🔄 Attempting recovery after seek failure')
      element.load()
      if (wasPlaying) {
        setTimeout(() => {
          element?.play().catch(console.error)
        }, 500)
      }
    }
  } finally {
    isSeeking.value = false
  }
}

const seek = (event: MouseEvent) => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element || !duration.value) {
    console.log('⏰ Cannot seek: no media element or duration')
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
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element) return

  const volumeSlider = event.currentTarget as HTMLElement
  const rect = volumeSlider.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const newVolume = Math.max(0, Math.min(1, percent))

  console.log('🔊 Setting volume to:', newVolume)
  element.volume = newVolume
  volume.value = newVolume

  // Unmute if volume is set above 0
  if (newVolume > 0 && isMuted.value) {
    toggleMute()
  }
}

const toggleMute = () => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element) return
  console.log('🔇 Toggling mute, current:', isMuted.value)
  element.muted = !element.muted
  isMuted.value = element.muted
}

const retry = () => {
  console.log('🔄 Retrying media load')
  hasError.value = false
  isLoading.value = true
  audioLoaded.value = false
  videoLoaded.value = false
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (element) {
    // Reset the media element completely
    element.load()
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

// Setup event listeners when media element is available
const setupMediaElement = () => {
  const element = isVideo.value ? videoElement.value : audioElement.value
  if (!element) {
    console.error('❌ Media element ref is still null in setupMediaElement')
    return
  }

  console.log('🎧 Media element found, attaching event listeners')

  // Remove any existing listeners first
  element.removeEventListener('loadedmetadata', onLoadedMetadata)
  element.removeEventListener('timeupdate', onTimeUpdate)
  element.removeEventListener('play', onPlay)
  element.removeEventListener('pause', onPause)
  element.removeEventListener('ended', onEnded)
  element.removeEventListener('volumechange', onVolumeChange)
  element.removeEventListener('error', onError)
  element.removeEventListener('loadstart', onLoadStart)
  element.removeEventListener('canplay', onCanPlay)
  element.removeEventListener('canplaythrough', onCanPlayThrough)
  element.removeEventListener('waiting', onWaiting)
  element.removeEventListener('stalled', onStalled)
  element.removeEventListener('progress', onProgress)

  // Add event listeners
  element.addEventListener('loadedmetadata', onLoadedMetadata)
  element.addEventListener('timeupdate', onTimeUpdate)
  element.addEventListener('play', onPlay)
  element.addEventListener('pause', onPause)
  element.addEventListener('ended', onEnded)
  element.addEventListener('volumechange', onVolumeChange)
  element.addEventListener('error', onError)
  element.addEventListener('loadstart', onLoadStart)
  element.addEventListener('canplay', onCanPlay)
  element.addEventListener('canplaythrough', onCanPlayThrough)
  element.addEventListener('waiting', onWaiting)
  element.addEventListener('stalled', onStalled)
  element.addEventListener('progress', onProgress)

  console.log('🔗 Event listeners attached to media element')
  console.log('🎵 Media source:', element.src)

  // Check initial state
  console.log('📊 Initial media state:', {
    readyState: element.readyState,
    networkState: element.networkState,
    duration: element.duration,
    paused: element.paused
  })

  // If media is already loaded, update state
  if (element.readyState >= 1) {
    console.log('⚡ Media already has metadata')
    onLoadedMetadata()
  }
}

// Fixed: Use proper VNodeRef type with type assertion
const setAudioRef: VNodeRef = (el: any) => {
  console.log('🎯 Setting audio ref:', el)
  audioElement.value = el as HTMLAudioElement | null
  if (el && !isVideo.value) {
    // Small delay to ensure the element is fully in the DOM
    setTimeout(() => {
      setupMediaElement()
    }, 10)
  }
}

const setVideoRef: VNodeRef = (el: any) => {
  console.log('🎯 Setting video ref:', el)
  videoElement.value = el as HTMLVideoElement | null
  if (el && isVideo.value) {
    // Small delay to ensure the element is fully in the DOM
    setTimeout(() => {
      setupMediaElement()
    }, 10)
  }
}

// Setup when component mounts
onMounted(async () => {
  console.log('🏗️ AvWidget mounted')

  // Try multiple times to find the media element
  const maxAttempts = 5
  let attempts = 0

  const trySetup = () => {
    attempts++
    console.log(`🔍 Attempt ${attempts} to find media element`)

    const element = isVideo.value ? videoElement.value : audioElement.value
    if (element) {
      console.log('✅ Media element found on attempt', attempts)
      setupMediaElement()
      return
    }

    if (attempts < maxAttempts) {
      console.log('⏳ Media element not found, retrying...')
      setTimeout(trySetup, 100)
    } else {
      console.error('❌ Failed to find media element after', maxAttempts, 'attempts')
      hasError.value = true
      isLoading.value = false
    }
  }

  // Start trying to find the media element
  trySetup()
})

watch(() => props.audioUrl, (newUrl) => {
  if (!isVideo.value && audioElement.value) {
    console.log('🔄 Audio URL changed to:', newUrl)
    audioElement.value.load()
  }
})

watch(() => props.videoUrl, (newUrl) => {
  if (isVideo.value && videoElement.value) {
    console.log('🔄 Video URL changed to:', newUrl)
    videoElement.value.load()
  }
})

// Watch for fileType changes
watch(() => props.fileType, (newFileType) => {
  console.log('🔄 File type changed to:', newFileType)
  isVideo.value = newFileType === 'video'

  // Re-setup the media element when type changes
  setTimeout(() => {
    const element = isVideo.value ? videoElement.value : audioElement.value
    if (element) {
      setupMediaElement()
    }
  }, 100)
})
</script>

<template>
  <div class="media-widget" :class="{ 'video-widget': isVideo, 'audio-widget': !isVideo }">
    <!-- Hidden audio element that's always in the DOM -->
    <audio v-if="!isVideo" :ref="setAudioRef" :src="audioUrl" <!-- Now optional prop -->
      preload="auto"
      class="media-element audio-element"
      crossorigin="anonymous"
      style="display: none"
      ></audio>

    <!-- Hidden video element that's always in the DOM -->
    <video v-else :ref="setVideoRef" :src="videoUrl" <!-- Now optional prop -->
      preload="auto"
      class="media-element video-element"
      crossorigin="anonymous"
      style="display: none"
      playsinline
      ></video>

    <!-- Loading State -->
    <div v-if="isLoading && !hasError" class="loading-state">
      <div class="spinner"></div>
      <!-- <p>Loading {{ isVideo ? 'video' : 'audio' }}...</p>
        <p class="debug-info">URL: {{ isVideo ? videoUrl : audioUrl }}</p>
        <p class="debug-info">Element: {{ (isVideo ? videoElement : audioElement) ? 'Found' : 'Not Found' }}</p>
        <p class="debug-info">Loaded: {{ isVideo ? videoLoaded : audioLoaded ? 'Yes' : 'No' }}</p>
        <p class="debug-info" v-if="isSeeking">Seeking...</p> -->
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">❌</div>
      <p>Failed to load {{ isVideo ? 'video' : 'audio' }}</p>
      <button @click="retry" class="retry-btn">Retry</button>
      <p class="debug-info">URL: {{ isVideo ? videoUrl : audioUrl }}</p>
      <p class="debug-info">Element: {{ (isVideo ? videoElement : audioElement) ? 'Found' : 'Not Found' }}</p>
    </div>

    <!-- Media Player Controls -->
    <div v-else class="media-player">
      <!-- Video Display -->
      <div v-if="isVideo" class="video-display">
        <video :ref="setVideoRef" :src="videoUrl" preload="auto" class="video-preview" crossorigin="anonymous"
          playsinline @click="togglePlayPause"></video>
        <div v-if="!isPlaying" class="video-overlay" @click="togglePlayPause">
          <div class="play-button">▶️</div>
        </div>
      </div>

      <div class="media-controls">
        <!-- Play/Pause Button -->
        <button @click="togglePlayPause" class="control-btn play-pause-btn" :title="isPlaying ? 'Pause' : 'Play'"
          :disabled="!audioElement && !videoElement || (!audioLoaded && !videoLoaded) || isSeeking">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>

        <!-- Time Display -->
        <span class="time-display">
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </span>

        <!-- Progress Bar -->
        <div class="progress-bar" @click="seek"
          :class="{ 'disabled': (!audioElement && !videoElement) || (!audioLoaded && !videoLoaded) || isSeeking }">
          <div class="progress-background"></div>
          <div class="progress-fill" :style="{ width: duration ? (currentTime / duration) * 100 + '%' : '0%' }"></div>
          <div class="progress-thumb" :style="{ left: duration ? (currentTime / duration) * 100 + '%' : '0%' }"></div>
        </div>

        <!-- Volume Controls -->
        <div class="volume-controls">
          <button @click="toggleMute" class="control-btn volume-btn" :title="isMuted ? 'Unmute' : 'Mute'"
            :disabled="(!audioElement && !videoElement) || (!audioLoaded && !videoLoaded) || isSeeking">
            {{ volumeIcon }}
          </button>
          <div class="volume-slider" @click="setVolume"
            :class="{ 'disabled': (!audioElement && !videoElement) || (!audioLoaded && !videoLoaded) || isSeeking }">
            <div class="volume-background"></div>
            <div class="volume-fill" :style="{ width: (isMuted ? 0 : volume) * 100 + '%' }"></div>
          </div>
        </div>

        <!-- Download Button -->
        <button @click="downloadFile" class="control-btn download-btn"
          :title="'Download ' + (isVideo ? 'video' : 'audio')" :disabled="isSeeking">
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
.media-widget {
  height: 7.5em;
  background: var(--background);
  border: 2.5px solid color-mix(in oklab, var(--background), var(--text) 25%);
  border-radius: 10px;
  padding: 15px;
  margin: 0 auto;
  text-indent: 0;
  display: block;
  font-family: inherit;
}

.video-widget {
  height: auto;
  min-height: 7.5em;
}

.video-display {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 15px auto;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.video-preview {
  width: 100%;
  height: auto;
  max-height: 400px;
  display: block;
  cursor: pointer;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.video-overlay:hover {
  background: rgba(0, 0, 0, 0.2);
}

.play-button {
  font-size: 3rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.video-overlay:hover .play-button {
  opacity: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
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
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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

.media-element {
  display: none;
}

.media-controls {
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
  .media-widget {
    padding: 12px;
  }

  .media-controls {
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

  .video-display {
    margin-bottom: 12px;
  }
}

@media (max-width: 480px) {
  .media-controls {
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

  .video-display {
    margin-bottom: 10px;
  }
}
</style>
