<!-- [file name]: AvWidget.vue -->
<script>
export default {
  name: 'AvWidget',
  props: {
    src: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ['audio', 'video'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    loop: {
      type: Boolean,
      default: false
    },
    muted: {
      type: Boolean,
      default: false
    },
    controls: {
      type: Boolean,
      default: true
    },
    poster: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      playbackRate: 1.0,
      isLoading: true,
      hasError: false,
      isDragging: false,
      showControls: true,
      controlsTimeout: null,
      isFullscreen: false
    };
  },
  computed: {
    progressPercentage() {
      if (this.duration === 0) return 0;
      return (this.currentTime / this.duration) * 100;
    },
    formattedCurrentTime() {
      return this.formatTime(this.currentTime);
    },
    formattedDuration() {
      return this.formatTime(this.duration);
    },
    volumeIcon() {
      if (this.isMuted || this.volume === 0) return '🔇';
      if (this.volume < 0.33) return '🔈';
      if (this.volume < 0.66) return '🔉';
      return '🔊';
    },
    playPauseIcon() {
      return this.isPlaying ? '⏸️' : '▶️';
    },
    mediaElement() {
      return this.$refs.media;
    },
    containerElement() {
      return this.$refs.container;
    }
  },
  watch: {
    src() {
      this.resetState();
      this.loadMedia();
    },
    muted(newVal) {
      this.isMuted = newVal;
      if (this.mediaElement) {
        this.mediaElement.muted = newVal;
      }
    }
  },
  mounted() {
    this.isMuted = this.muted;
    this.loadMedia();
    this.setupEventListeners();
  },
  beforeUnmount() {
    this.cleanupEventListeners();
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  },
  methods: {
    async loadMedia() {
      this.isLoading = true;
      this.hasError = false;

      try {
        // Media will load automatically when src is set
        // The loadedmetadata event will handle the rest
      } catch (error) {
        console.error('Error loading media:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    },
    setupEventListeners() {
      const media = this.mediaElement;
      if (!media) return;

      media.addEventListener('loadedmetadata', this.onLoadedMetadata);
      media.addEventListener('timeupdate', this.onTimeUpdate);
      media.addEventListener('play', this.onPlay);
      media.addEventListener('pause', this.onPause);
      media.addEventListener('ended', this.onEnded);
      media.addEventListener('volumechange', this.onVolumeChange);
      media.addEventListener('waiting', this.onWaiting);
      media.addEventListener('canplay', this.onCanPlay);
      media.addEventListener('error', this.onError);

      // Mouse movement detection for controls
      if (this.containerElement) {
        this.containerElement.addEventListener('mousemove', this.showControlsTemporarily);
        this.containerElement.addEventListener('mouseleave', this.hideControls);
      }
    },
    cleanupEventListeners() {
      const media = this.mediaElement;
      if (!media) return;

      media.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      media.removeEventListener('timeupdate', this.onTimeUpdate);
      media.removeEventListener('play', this.onPlay);
      media.removeEventListener('pause', this.onPause);
      media.removeEventListener('ended', this.onEnded);
      media.removeEventListener('volumechange', this.onVolumeChange);
      media.removeEventListener('waiting', this.onWaiting);
      media.removeEventListener('canplay', this.onCanPlay);
      media.removeEventListener('error', this.onError);

      if (this.containerElement) {
        this.containerElement.removeEventListener('mousemove', this.showControlsTemporarily);
        this.containerElement.removeEventListener('mouseleave', this.hideControls);
      }
    },
    onLoadedMetadata() {
      this.duration = this.mediaElement.duration;
      this.isLoading = false;
    },
    onTimeUpdate() {
      this.currentTime = this.mediaElement.currentTime;
    },
    onPlay() {
      this.isPlaying = true;
    },
    onPause() {
      this.isPlaying = false;
    },
    onEnded() {
      this.isPlaying = false;
      this.currentTime = 0;
    },
    onVolumeChange() {
      this.volume = this.mediaElement.volume;
      this.isMuted = this.mediaElement.muted;
    },
    onWaiting() {
      this.isLoading = true;
    },
    onCanPlay() {
      this.isLoading = false;
    },
    onError() {
      this.hasError = true;
      this.isLoading = false;
      console.error('Media error:', this.mediaElement.error);
    },
    togglePlayPause() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    play() {
      this.mediaElement.play().catch(error => {
        console.error('Error playing media:', error);
        this.hasError = true;
      });
    },
    pause() {
      this.mediaElement.pause();
    },
    seek(event) {
      if (!this.isDragging) return;

      const progressBar = event.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const newTime = percent * this.duration;

      this.mediaElement.currentTime = newTime;
      this.currentTime = newTime;
    },
    startDragging(event) {
      this.isDragging = true;
      this.seek(event);

      // Add global mouse event listeners
      document.addEventListener('mousemove', this.drag);
      document.addEventListener('mouseup', this.stopDragging);
    },
    drag(event) {
      if (!this.isDragging) return;
      this.seek(event);
    },
    stopDragging() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.drag);
      document.removeEventListener('mouseup', this.stopDragging);
    },
    setVolume(event) {
      const volumeSlider = event.currentTarget;
      const rect = volumeSlider.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      const newVolume = Math.max(0, Math.min(1, percent));

      this.mediaElement.volume = newVolume;
      this.volume = newVolume;

      // Unmute if volume is set above 0
      if (newVolume > 0 && this.isMuted) {
        this.toggleMute();
      }
    },
    toggleMute() {
      this.mediaElement.muted = !this.mediaElement.muted;
      this.isMuted = this.mediaElement.muted;
    },
    changePlaybackRate(rate) {
      this.playbackRate = rate;
      this.mediaElement.playbackRate = rate;
    },
    formatTime(seconds) {
      if (isNaN(seconds)) return '0:00';

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    showControlsTemporarily() {
      this.showControls = true;

      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout);
      }

      this.controlsTimeout = setTimeout(() => {
        if (this.isPlaying) {
          this.showControls = false;
        }
      }, 3000);
    },
    hideControls() {
      if (this.isPlaying) {
        this.showControls = false;
      }
    },
    toggleFullscreen() {
      if (!this.containerElement) return;

      if (!document.fullscreenElement) {
        if (this.containerElement.requestFullscreen) {
          this.containerElement.requestFullscreen();
        } else if (this.containerElement.webkitRequestFullscreen) {
          this.containerElement.webkitRequestFullscreen();
        } else if (this.containerElement.msRequestFullscreen) {
          this.containerElement.msRequestFullscreen();
        }
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isFullscreen = false;
      }
    },
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    },
    resetState() {
      this.isPlaying = false;
      this.currentTime = 0;
      this.duration = 0;
      this.isLoading = true;
      this.hasError = false;
    },
    retry() {
      this.resetState();
      this.loadMedia();
    }
  }
};
</script>

<template>
  <div
    ref="container"
    class="av-widget"
    :class="{
      'audio-widget': type === 'audio',
      'video-widget': type === 'video',
      'has-error': hasError,
      'is-loading': isLoading,
      'is-fullscreen': isFullscreen
    }"
    @mousemove="showControlsTemporarily"
    @mouseleave="hideControls"
  >
    <!-- Loading State -->
    <div v-if="isLoading && !hasError" class="loading-state">
      <div class="spinner"></div>
      <p>Loading {{ type }}...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">❌</div>
      <p>Failed to load {{ type }}</p>
      <button @click="retry" class="retry-btn">Retry</button>
    </div>

    <!-- Media Content -->
    <div v-else class="media-content">
      <!-- Audio Player -->
      <audio
        v-if="type === 'audio'"
        ref="media"
        :src="src"
        :autoplay="autoplay"
        :loop="loop"
        :muted="muted"
        :controls="false"
        preload="metadata"
        class="media-element"
      ></audio>

      <!-- Video Player -->
      <video
        v-else
        ref="media"
        :src="src"
        :autoplay="autoplay"
        :loop="loop"
        :muted="muted"
        :controls="false"
        :poster="poster"
        preload="metadata"
        class="media-element"
      ></video>

      <!-- Custom Controls Overlay -->
      <div
        v-if="controls"
        class="controls-overlay"
        :class="{ 'controls-visible': showControls || !isPlaying }"
      >
        <!-- Top Bar (Video Title) -->
        <div v-if="title && type === 'video'" class="top-bar">
          <h3 class="media-title">{{ title }}</h3>
        </div>

        <!-- Center Play/Pause Button (Large) -->
        <div class="center-controls">
          <button
            v-if="!isPlaying"
            @click="togglePlayPause"
            class="center-play-btn"
            :title="isPlaying ? 'Pause' : 'Play'"
          >
            ▶️
          </button>
        </div>

        <!-- Bottom Controls Bar -->
        <div class="bottom-controls">
          <!-- Play/Pause Button -->
          <button
            @click="togglePlayPause"
            class="control-btn"
            :title="isPlaying ? 'Pause' : 'Play'"
          >
            {{ playPauseIcon }}
          </button>

          <!-- Time Display -->
          <span class="time-display">
            {{ formattedCurrentTime }} / {{ formattedDuration }}
          </span>

          <!-- Progress Bar -->
          <div
            class="progress-bar"
            @mousedown="startDragging"
            @click="seek"
          >
            <div class="progress-background"></div>
            <div
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div
              class="progress-thumb"
              :style="{ left: progressPercentage + '%' }"
            ></div>
          </div>

          <!-- Volume Controls -->
          <div class="volume-controls">
            <button
              @click="toggleMute"
              class="control-btn"
              :title="isMuted ? 'Unmute' : 'Mute'"
            >
              {{ volumeIcon }}
            </button>
            <div
              class="volume-slider"
              @click="setVolume"
            >
              <div class="volume-background"></div>
              <div
                class="volume-fill"
                :style="{ width: (isMuted ? 0 : volume) * 100 + '%' }"
              ></div>
            </div>
          </div>

          <!-- Playback Rate -->
          <select
            v-model="playbackRate"
            @change="changePlaybackRate(parseFloat($event.target.value))"
            class="playback-rate-select"
            title="Playback Speed"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2.0">2x</option>
          </select>

          <!-- Fullscreen Button (Video only) -->
          <button
            v-if="type === 'video'"
            @click="toggleFullscreen"
            class="control-btn"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
          >
            {{ isFullscreen ? '⤵️' : '⤴️' }}
          </button>
        </div>
      </div>

      <!-- Fallback to native controls if custom controls fail -->
      <div v-if="hasError && controls" class="native-controls-fallback">
        <audio
          v-if="type === 'audio'"
          :src="src"
          :autoplay="autoplay"
          :loop="loop"
          :muted="muted"
          :controls="true"
          class="native-media"
        ></audio>
        <video
          v-else
          :src="src"
          :autoplay="autoplay"
          :loop="loop"
          :muted="muted"
          :controls="true"
          :poster="poster"
          class="native-media"
        ></video>
      </div>
    </div>
  </div>
</template>

<style scoped>
.av-widget {
  position: relative;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.audio-widget {
  min-height: 80px;
  padding: 15px;
}

.video-widget {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.av-widget.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  border-radius: 0;
}

.media-element {
  width: 100%;
  height: 100%;
  display: block;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ccc;
}

.spinner {
  border: 3px solid #333;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ff6b6b;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background: #0056b3;
}

/* Controls Overlay */
.controls-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 0, 0, 0.6) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.controls-overlay.controls-visible {
  opacity: 1;
  pointer-events: all;
}

.controls-overlay:hover {
  opacity: 1;
}

/* Top Bar */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
}

.media-title {
  color: white;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Center Controls */
.center-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.center-play-btn {
  background: rgba(0, 123, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  font-size: 1.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.center-play-btn:hover {
  background: rgba(0, 123, 255, 1);
  transform: scale(1.1);
}

/* Bottom Controls */
.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.time-display {
  color: white;
  font-size: 0.9rem;
  min-width: 80px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Progress Bar */
.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  margin: 0 10px;
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #007bff;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* Volume Controls */
.volume-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  display: none;
}

.volume-controls:hover .volume-slider {
  display: block;
}

.volume-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.volume-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: #007bff;
  border-radius: 2px;
}

/* Playback Rate Select */
.playback-rate-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.playback-rate-select option {
  background: #1a1a1a;
  color: white;
}

/* Native Controls Fallback */
.native-controls-fallback {
  display: none;
}

.native-media {
  width: 100%;
  height: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .audio-widget {
    min-height: 60px;
    padding: 10px;
  }

  .bottom-controls {
    padding: 10px;
    gap: 8px;
  }

  .control-btn {
    font-size: 1rem;
  }

  .time-display {
    font-size: 0.8rem;
    min-width: 70px;
  }

  .volume-slider {
    width: 60px;
  }

  .center-play-btn {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .playback-rate-select {
    display: none;
  }

  .volume-slider {
    width: 50px;
  }
}

/* Audio-specific styles */
.audio-widget .media-element {
  display: none; /* Hide the audio element, we'll use custom controls */
}

.audio-widget .controls-overlay {
  position: relative;
  background: transparent;
  opacity: 1;
  pointer-events: all;
}

.audio-widget .top-bar {
  position: relative;
  background: transparent;
  padding: 0 0 10px 0;
}

.audio-widget .media-title {
  color: #333;
  text-shadow: none;
}

.audio-widget .center-controls {
  display: none;
}

.audio-widget .bottom-controls {
  position: relative;
  background: transparent;
  padding: 0;
}

.audio-widget .progress-bar {
  margin: 10px 0;
}

.audio-widget .control-btn {
  color: #333;
}

.audio-widget .time-display {
  color: #333;
}

.audio-widget .playback-rate-select {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: #333;
}

.audio-widget .playback-rate-select option {
  background: white;
  color: #333;
}
</style>
