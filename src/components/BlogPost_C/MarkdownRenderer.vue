<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useTheme } from '@/composables/useTheme'
import AvWidget from './AvWidget.vue'
import "@/assets/syntaxHighlighting.css"

interface AttachedFile {
  filename: string
  fileId: string
  uploadDate: string
  fileType?: string
  attachmentType?: string
  sequence?: number
}

interface Props {
  postContent: string
  attachedFiles: AttachedFile[]
}

interface ContentPart {
  type: 'html' | 'audio' | 'video'
  content?: string
  audioUrl?: string
  videoUrl?: string
  filename?: string
  fileId?: string
  sequence?: number
}

interface MediaWidgetPosition {
  fileId: string
  filename: string
  audioUrl?: string
  videoUrl?: string
  sequence?: number
  index: number
  type: 'audio' | 'video'
}

const props = defineProps<Props>()
const renderedContent = ref('')
const hljs = ref<any>(null)
const { isDarkMode } = useTheme()

// Track media widget positions (both audio and video)
const mediaWidgetPositions = ref<MediaWidgetPosition[]>([])

// Configure marked
const configureMarked = () => {
  marked.setOptions({
    breaks: true,
    gfm: true,
  })
}

// Initialize marked configuration
configureMarked()

// Get audio files from attached files
const audioFiles = computed(() => {
  console.log('🔍 Computing audio files from attachedFiles:', props.attachedFiles)
  if (!props.attachedFiles) {
    console.log('❌ No attached files provided')
    return []
  }

  const audioFiles = props.attachedFiles.filter(file => {
    // Check attachmentType
    if (file.attachmentType === 'audio') {
      console.log('✅ Found audio file by attachmentType:', file.filename)
      return true
    }

    // Check filename extension as fallback
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']
    const isAudio = audioExtensions.some(ext =>
      file.filename.toLowerCase().endsWith(ext)
    )

    if (isAudio) {
      console.log('✅ Found audio file by extension:', file.filename)
    }

    return isAudio
  })

  console.log('🎵 Final audio files:', audioFiles)
  return audioFiles
})

// Get video files from attached files
const videoFiles = computed(() => {
  console.log('🔍 Computing video files from attachedFiles:', props.attachedFiles)
  if (!props.attachedFiles) {
    console.log('❌ No attached files provided')
    return []
  }

  const videoFiles = props.attachedFiles.filter(file => {
    // Check attachmentType
    if (file.attachmentType === 'video') {
      console.log('✅ Found video file by attachmentType:', file.filename)
      return true
    }

    // Check fileType
    if (file.fileType === 'video') {
      console.log('✅ Found video file by fileType:', file.filename)
      return true
    }

    // Check filename extension as fallback
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
    const isVideo = videoExtensions.some(ext =>
      file.filename.toLowerCase().endsWith(ext)
    )

    if (isVideo) {
      console.log('✅ Found video file by extension:', file.filename)
    }

    return isVideo
  })

  console.log('🎥 Final video files:', videoFiles)
  return videoFiles
})

// Get sequenced audio files (audio with sequence numbers)
const sequencedAudio = computed(() => {
  if (!audioFiles.value) {
    console.log('❌ No audio files for sequenced audio')
    return []
  }

  const sequenced = audioFiles.value.filter(file => file.sequence !== undefined)
  const sorted = sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))

  console.log('🎵 Sequenced audio files:', sorted)
  return sorted
})

// Get sequenced video files (video with sequence numbers)
const sequencedVideo = computed(() => {
  if (!videoFiles.value) {
    console.log('❌ No video files for sequenced video')
    return []
  }

  const sequenced = videoFiles.value.filter(file => file.sequence !== undefined)
  const sorted = sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))

  console.log('🎥 Sequenced video files:', sorted)
  return sorted
})

// Get additional audio files (audio without sequence numbers)
const additionalAudio = computed(() => {
  if (!audioFiles.value) {
    console.log('❌ No audio files for additional audio')
    return []
  }

  const additional = audioFiles.value.filter(file => file.sequence === undefined)
  const sorted = additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )

  console.log('🎵 Additional audio files:', sorted)
  return sorted
})

// Get additional video files (video without sequence numbers)
const additionalVideo = computed(() => {
  if (!videoFiles.value) {
    console.log('❌ No video files for additional video')
    return []
  }

  const additional = videoFiles.value.filter(file => file.sequence === undefined)
  const sorted = additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )

  console.log('🎥 Additional video files:', sorted)
  return sorted
})

// Get sequenced images (images with sequence numbers)
const sequencedImages = computed(() => {
  if (!props.attachedFiles) {
    console.log('❌ No attached files for sequenced images')
    return []
  }

  const sequenced = props.attachedFiles.filter(file =>
    file.fileType === 'in-text' && file.sequence !== undefined
  )

  const sorted = sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
  console.log('🖼️ Sequenced images:', sorted)
  return sorted
})

// Get additional images (images without sequence numbers)
const additionalImages = computed(() => {
  if (!props.attachedFiles) {
    console.log('❌ No attached files for additional images')
    return []
  }

  const additional = props.attachedFiles.filter(file =>
    file.fileType === 'attachment' && file.sequence === undefined
  )

  const sorted = additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )

  console.log('🖼️ Additional images:', sorted)
  return sorted
})

// Process markdown content to replace image, audio, and video placeholders
const processMarkdownContent = (content: string) => {
  console.log('🔄 Starting markdown content processing')
  console.log('📄 Original content:', content)

  let processedContent = content
  mediaWidgetPositions.value = [] // Reset positions

  console.log('🎵 Sequenced audio available:', sequencedAudio.value)
  console.log('🎥 Sequenced video available:', sequencedVideo.value)
  console.log('🖼️ Sequenced images available:', sequencedImages.value)

  // First, replace numbered video placeholders (video1, video2, etc.)
  sequencedVideo.value.forEach((video, index) => {
    const videoNumber = index + 1
    const videoUrl = `/api/file/${video.fileId}`

    console.log(`🎥 Processing video${videoNumber}:`, video.filename)

    // Pattern for video links: [alt text](video1)
    const videoPattern = new RegExp(`\\[([^\\]]*)\\]\\(video${videoNumber}\\)`, 'gi')

    const videoMatches = processedContent.match(videoPattern)
    if (videoMatches) {
      console.log(`🎥 Found video pattern matches for video${videoNumber}:`, videoMatches)
    }

    // Track this video widget position
    const widgetIndex = mediaWidgetPositions.value.length
    mediaWidgetPositions.value.push({
      fileId: video.fileId,
      filename: video.filename,
      videoUrl: videoUrl,
      sequence: video.sequence,
      index: widgetIndex,
      type: 'video'
    })

    // Replace with a unique marker
    processedContent = processedContent.replace(
      videoPattern,
      `<div class="video-widget-marker" data-video-index="${widgetIndex}"></div>`
    )
  })

  // Then, replace numbered audio placeholders (audio1, audio2, etc.)
  sequencedAudio.value.forEach((audio, index) => {
    const audioNumber = index + 1
    const audioUrl = `/api/file/${audio.fileId}`

    console.log(`🎵 Processing audio${audioNumber}:`, audio.filename)

    // Pattern for audio links: [alt text](audio1)
    const audioPattern = new RegExp(`\\[([^\\]]*)\\]\\(audio${audioNumber}\\)`, 'gi')

    const audioMatches = processedContent.match(audioPattern)
    if (audioMatches) {
      console.log(`🎵 Found audio pattern matches for audio${audioNumber}:`, audioMatches)
    }

    // Track this audio widget position
    const widgetIndex = mediaWidgetPositions.value.length
    mediaWidgetPositions.value.push({
      fileId: audio.fileId,
      filename: audio.filename,
      audioUrl: audioUrl,
      sequence: audio.sequence,
      index: widgetIndex,
      type: 'audio'
    })

    // Replace with a unique marker
    processedContent = processedContent.replace(
      audioPattern,
      `<div class="audio-widget-marker" data-audio-index="${widgetIndex}"></div>`
    )
  })

  // Then, replace numbered image placeholders (image1, image2, etc.)
  sequencedImages.value.forEach((image, index) => {
    const imageNumber = index + 1
    const imageUrl = `/api/file/${image.fileId}`

    console.log(`🖼️ Processing image${imageNumber}:`, image.filename)

    // Pattern for markdown images: ![alt text](image1)
    const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'gi')
    // Pattern for links that should be images: [alt text](image1)
    const linkPattern = new RegExp(`\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'gi')

    // Replace markdown images
    processedContent = processedContent.replace(
      imagePattern,
      `![$1](${imageUrl})`
    )

    processedContent = processedContent.replace(
      linkPattern,
      `![$1](${imageUrl})`
    )
  })

  console.log('📝 Content after numbered processing:', processedContent)

  // Then, handle any remaining image references that might match filenames
  const genericImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  const genericLinkPattern = /\[([^\]]*)\]\(([^)]+)\)/g

  // First process proper image syntax
  processedContent = processedContent.replace(genericImagePattern, (match, altText, src) => {
    if (src.startsWith('http') || src.startsWith('/api/file/') || src.startsWith('data:')) {
      return match
    }

    const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
      img => img.filename === src || img.filename.includes(src)
    )

    if (matchingImage) {
      console.log(`🖼️ Found matching image for "${src}":`, matchingImage.filename)
      return `![${altText}](/api/file/${matchingImage.fileId})`
    }

    return match
  })

  // Then process links that might be intended as images, audio, or video
  processedContent = processedContent.replace(genericLinkPattern, (match, altText, src) => {
    if (src.startsWith('http') || src.startsWith('/api/file/') || src.startsWith('data:')) {
      return match
    }

    if (src.match(/^image\d+$/)) {
      console.log(`⏩ Skipping already processed image reference: ${src}`)
      return match
    }

    if (src.match(/^audio\d+$/)) {
      console.log(`⏩ Skipping already processed audio reference: ${src}`)
      return match
    }

    if (src.match(/^video\d+$/)) {
      console.log(`⏩ Skipping already processed video reference: ${src}`)
      return match
    }

    const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
      img => img.filename === src || img.filename.includes(src)
    )

    if (matchingImage) {
      console.log(`🖼️ Converting link to image for "${src}":`, matchingImage.filename)
      return `![${altText}](/api/file/${matchingImage.fileId})`
    }

    const matchingAudio = [...sequencedAudio.value, ...additionalAudio.value].find(
      audio => audio.filename === src || audio.filename.includes(src)
    )

    if (matchingAudio) {
      console.log(`🎵 Converting link to audio widget for "${src}":`, matchingAudio.filename)

      // Track this additional audio widget position
      const widgetIndex = mediaWidgetPositions.value.length
      mediaWidgetPositions.value.push({
        fileId: matchingAudio.fileId,
        filename: matchingAudio.filename,
        audioUrl: `/api/file/${matchingAudio.fileId}`,
        sequence: matchingAudio.sequence,
        index: widgetIndex,
        type: 'audio'
      })

      return `<div class="audio-widget-marker" data-audio-index="${widgetIndex}"></div>`
    }

    const matchingVideo = [...sequencedVideo.value, ...additionalVideo.value].find(
      video => video.filename === src || video.filename.includes(src)
    )

    if (matchingVideo) {
      console.log(`🎥 Converting link to video widget for "${src}":`, matchingVideo.filename)

      // Track this additional video widget position
      const widgetIndex = mediaWidgetPositions.value.length
      mediaWidgetPositions.value.push({
        fileId: matchingVideo.fileId,
        filename: matchingVideo.filename,
        videoUrl: `/api/file/${matchingVideo.fileId}`,
        sequence: matchingVideo.sequence,
        index: widgetIndex,
        type: 'video'
      })

      return `<div class="video-widget-marker" data-video-index="${widgetIndex}"></div>`
    }

    return match
  })

  console.log('✅ Final processed content:', processedContent)
  console.log('🎵 Media widget positions:', mediaWidgetPositions.value)
  return processedContent
}

// Computed property to split content around media markers
const splitContentWithWidgets = computed(() => {
  if (!renderedContent.value) {
    console.log('❌ No rendered content available for splitting')
    return []
  }

  const parts: ContentPart[] = []
  let currentContent = renderedContent.value

  console.log(`🔪 Splitting content with ${mediaWidgetPositions.value.length} media markers`)

  // Process each media widget position in order
  mediaWidgetPositions.value.forEach((widget, index) => {
    const marker = widget.type === 'video'
      ? `<div class="video-widget-marker" data-video-index="${index}"></div>`
      : `<div class="audio-widget-marker" data-audio-index="${index}"></div>`

    const markerIndex = currentContent.indexOf(marker)

    if (markerIndex !== -1) {
      // Add content before the marker
      if (markerIndex > 0) {
        parts.push({
          type: 'html',
          content: currentContent.substring(0, markerIndex)
        })
      }

      // Add the media widget
      if (widget.type === 'video') {
        parts.push({
          type: 'video',
          videoUrl: widget.videoUrl,
          filename: widget.filename,
          fileId: widget.fileId,
          sequence: widget.sequence
        })
      } else {
        parts.push({
          type: 'audio',
          audioUrl: widget.audioUrl,
          filename: widget.filename,
          fileId: widget.fileId,
          sequence: widget.sequence
        })
      }

      // Update current content to after the marker
      currentContent = currentContent.substring(markerIndex + marker.length)
      console.log(`✅ Added ${widget.type} widget at position ${index}: ${widget.filename}`)
    } else {
      console.log(`❌ Could not find marker for ${widget.type} widget ${index}: ${widget.filename}`)
    }
  })

  // Add any remaining content
  if (currentContent.length > 0) {
    parts.push({
      type: 'html',
      content: currentContent
    })
  }

  console.log(`📋 Split content into ${parts.length} parts`)
  console.log('📊 Parts breakdown:', parts.map(p => p.type))
  return parts
})

// Render markdown content
const renderMarkdownContent = async (content: string) => {
  console.log('📝 Starting markdown content rendering')
  console.log('📄 Input content length:', content.length)

  // Process content to replace image, audio, and video placeholders with markers
  let processedContent = processMarkdownContent(content)
  console.log('📝 Processed content length:', processedContent.length)

  try {
    console.log('🔄 Parsing markdown with marked...')
    const rawHtml = await marked.parse(processedContent)
    console.log('✅ Markdown parsed successfully')

    console.log('🔄 Sanitizing HTML with DOMPurify...')
    renderedContent.value = DOMPurify.sanitize(rawHtml)
    console.log('✅ HTML sanitized successfully')

    console.log('⏳ Waiting for next tick...')
    await nextTick()
    console.log('✅ Next tick completed')

    // Apply syntax highlighting after the content is rendered
    if (hljs.value) {
      console.log('🎨 Applying syntax highlighting...')
      document.querySelectorAll('.markdown-content pre code').forEach((block) => {
        hljs.value.highlightElement(block)
      })
    }

    addCopyButtons()
    console.log('✅ Markdown rendering completed')
  } catch (err) {
    console.error('❌ Error rendering markdown:', err)
    renderedContent.value = DOMPurify.sanitize(processedContent)
  }
}

// Add copy buttons to code blocks
const addCopyButtons = () => {
  const preElements = document.querySelectorAll('.markdown-content pre')
  console.log(`📋 Found ${preElements.length} pre elements for copy buttons`)
  preElements.forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return

    const code = pre.querySelector('code')
    if (!code) return

    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-btn'
    copyBtn.textContent = 'Copy'
    copyBtn.onclick = async () => {
      try {
        const textToCopy = code.textContent || ''
        await navigator.clipboard.writeText(textToCopy)
        copyBtn.textContent = 'Copied!'
        setTimeout(() => {
          copyBtn.textContent = 'Copy'
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
        copyBtn.textContent = 'Failed'
        setTimeout(() => {
          copyBtn.textContent = 'Copy'
        }, 2000)
      }
    }

    pre.style.position = 'relative'
    pre.appendChild(copyBtn)
  })
}

// Handle download event from AvWidget
const handleDownload = (fileId: string, filename: string) => {
  console.log('📥 Download requested:', { fileId, filename })
  // Emit to parent component or handle download here
}

// Load highlight.js dynamically
const loadHighlightJS = async () => {
  console.log('🔄 Loading highlight.js...')
  if (typeof window !== 'undefined') {
    try {
      const hljsModule = await import('highlight.js/lib/core')
      hljs.value = hljsModule.default

      // Import specific languages
      const rustLang = await import('highlight.js/lib/languages/rust')
      const cLang = await import('highlight.js/lib/languages/c')
      const haskellLang = await import('highlight.js/lib/languages/haskell')
      const pythonLang = await import('highlight.js/lib/languages/python')
      const javascriptLang = await import('highlight.js/lib/languages/javascript')
      const typescriptLang = await import('highlight.js/lib/languages/typescript')
      const xmlLang = await import('highlight.js/lib/languages/xml')

      // Register languages
      hljs.value.registerLanguage('rust', rustLang.default)
      hljs.value.registerLanguage('c', cLang.default)
      hljs.value.registerLanguage('haskell', haskellLang.default)
      hljs.value.registerLanguage('python', pythonLang.default)
      hljs.value.registerLanguage('javascript', javascriptLang.default)
      hljs.value.registerLanguage('typescript', typescriptLang.default)
      hljs.value.registerLanguage('html', xmlLang.default)

      console.log('✅ Highlight.js loaded successfully')

      configureMarked()

      if (props.postContent) {
        await renderMarkdownContent(props.postContent)
      }
    } catch (err) {
      console.warn('❌ Failed to load highlight.js:', err)
      hljs.value = null
    }
  }
}

// Watch for theme changes and update syntax highlighting
watch(isDarkMode, async (newIsDarkMode) => {
  console.log(`🎨 Theme changed to ${newIsDarkMode ? 'dark' : 'light'}, updating syntax highlighting`)

  if (props.postContent) {
    await renderMarkdownContent(props.postContent)
  }
})

onMounted(async () => {
  console.log('🏗️ MarkdownRenderer mounted')
  console.log('📄 Initial postContent:', props.postContent)
  console.log('📎 Initial attachedFiles:', props.attachedFiles)

  await loadHighlightJS()
  if (props.postContent) {
    await renderMarkdownContent(props.postContent)
  }
})

watch(() => props.postContent, async (newContent) => {
  console.log('🔄 postContent changed:', newContent)
  if (newContent) {
    await renderMarkdownContent(newContent)
  }
})

// Also watch for attachedFiles changes in case they load after content
watch(() => props.attachedFiles, async (newFiles) => {
  console.log('🔄 attachedFiles changed:', newFiles)
  if (newFiles && props.postContent) {
    console.log('🔄 Attached files updated, re-rendering markdown with images and media')
    await renderMarkdownContent(props.postContent)
  }
}, { deep: true })
</script>

<template>
  <div class="markdown-content">
    <!-- Debug info -->
    <!-- <div v-if="mediaWidgetPositions.length > 0" class="debug-info">
      <p>🎵 Found {{ mediaWidgetPositions.length }} media widgets to render</p>
      <div v-for="widget in mediaWidgetPositions" :key="widget.fileId + '-' + widget.index" class="debug-widget-item">
        {{ widget.filename }} ({{ widget.type }}, Position: {{ widget.index }})
      </div>
    </div> -->

    <!-- Render content split around media widgets -->
    <template v-if="splitContentWithWidgets.length > 0">
      <div v-for="(part, index) in splitContentWithWidgets" :key="index">
        <!-- Regular markdown content -->
        <div v-if="part.type === 'html'" v-html="part.content"></div>

        <!-- Audio widget -->
        <div v-else-if="part.type === 'audio'" class="audio-widget-container">
          <AvWidget
            :audio-url="part.audioUrl"
            :filename="part.filename"
            :file-id="part.fileId"
            file-type="audio"
            @download="handleDownload"
          />
        </div>

        <!-- Video widget -->
        <div v-else-if="part.type === 'video'" class="video-widget-container">
          <AvWidget
            :video-url="part.videoUrl"
            :filename="part.filename"
            :file-id="part.fileId"
            file-type="video"
            @download="handleDownload"
          />
        </div>
      </div>
    </template>

    <!-- Fallback if no content is split (shouldn't happen normally) -->
    <div v-else-if="renderedContent" v-html="renderedContent"></div>
  </div>
</template>

<style scoped>
.markdown-content {
  line-height: 1.7;
  color: var(--text);
}

.debug-info {
  background: color-mix(in oklab, var(--focused), transparent 90%);
  border: 1px solid var(--focused);
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
  font-size: 0.8rem;
}

.debug-widget-item {
  background: color-mix(in oklab, #4CAF50, transparent 90%);
  border: 1px solid #4CAF50;
  border-radius: 4px;
  padding: 4px;
  margin: 4px 0;
  font-size: 0.7rem;
}

.debug-fallback {
  background: color-mix(in oklab, #f44336, transparent 90%);
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
  font-size: 0.8rem;
}

.audio-widget-container {
  margin: 2em auto;
  max-width: 40vw;
}

.video-widget-container {
  margin: 2em auto;
  max-width: 80vw;
}

.markdown-content :deep(h1) {
  font-size: 2em;
  margin: 0.67em 0;
  color: var(--text);
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  margin: 0.83em 0;
  color: var(--text);
}

.markdown-content :deep(h3) {
  font-size: 1.17em;
  margin: 1em 0;
  color: var(--text);
}

.markdown-content :deep(p) {
  margin: 1em 0;
  text-indent: 2em;
}

.markdown-content :deep(a) {
  color: var(--focused);
  text-decoration: none;
}

.markdown-content :deep(strong) {
  font-weight: bold;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
  color: color-mix(in oklab, var(--text), var(--focused) 60%);
  background-color: color-mix(in oklab, var(--background), var(--focused) 40%);
  border-radius: 5px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--focused);
  margin: 1em 0;
  padding-left: 1em;
  color: color-mix(in oklab, var(--text), transparent 30%);
}

.markdown-content :deep(hr) {
  border: none;
  height: 2px;
  background-color: color-mix(in oklab, var(--text), transparent 70%);
  margin: 2em 0;
  border-radius: 1px;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid color-mix(in oklab, var(--text), transparent 70%);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(table th) {
  background-color: color-mix(in oklab, var(--focused), transparent 90%);
  font-weight: 600;
}

.markdown-content :deep(.copy-btn) {
  position: absolute;
  top: 8px;
  right: 8px;
  background: color-mix(in oklab, var(--focused), transparent 20%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.markdown-content :deep(.copy-btn:hover) {
  opacity: 1;
  background: var(--focused);
}

.markdown-content :deep(img) {
  max-width: 95%;
  max-height: 80vh;
  border-radius: 6px;
  margin: 0 auto;
  text-indent: 0;
  border: solid 2.5px;
  border-radius: 10px;
  border-color: color-mix(in oklab, var(--background), var(--text) 25%);
  display: block;
}

.markdown-content :deep(p > img) {
  text-indent: 0;
  margin: 1em auto;
}

/* Hide the media markers in the final output */
.markdown-content :deep(.audio-widget-marker),
.markdown-content :deep(.video-widget-marker) {
  display: none;
}
</style>
