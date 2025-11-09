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

const props = defineProps<Props>()
const renderedContent = ref('')
const hljs = ref<any>(null)
const { isDarkMode } = useTheme()

// Audio widgets data
const audioWidgets = ref<Array<{
  fileId: string
  filename: string
  audioUrl: string
  sequence?: number
}>>([])

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

// Process markdown content to replace image and audio placeholders
const processMarkdownContent = (content: string) => {
  console.log('🔄 Starting markdown content processing')
  console.log('📄 Original content:', content)

  let processedContent = content

  console.log('🎵 Sequenced audio available:', sequencedAudio.value)
  console.log('🖼️ Sequenced images available:', sequencedImages.value)

  // First, replace numbered audio placeholders (audio1, audio2, etc.)
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

    // Replace audio links with audio widget data attribute
    processedContent = processedContent.replace(
      audioPattern,
      `<div class="audio-widget" data-file-id="${audio.fileId}" data-filename="${audio.filename}" data-audio-url="${audioUrl}" data-sequence="${audio.sequence}"></div>`
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
    const imageMatches = processedContent.match(imagePattern)
    if (imageMatches) {
      console.log(`🖼️ Found image pattern matches for image${imageNumber}:`, imageMatches)
    }

    // Replace links that should be images (convert to proper image syntax)
    const linkMatches = processedContent.match(linkPattern)
    if (linkMatches) {
      console.log(`🖼️ Found link pattern matches for image${imageNumber}:`, linkMatches)
    }

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

  // Then process links that might be intended as images or audio
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
      return `<div class="audio-widget" data-file-id="${matchingAudio.fileId}" data-filename="${matchingAudio.filename}" data-audio-url="/api/file/${matchingAudio.fileId}" data-sequence="${matchingAudio.sequence || ''}"></div>`
    }

    return match
  })

  console.log('✅ Final processed content:', processedContent)
  return processedContent
}

// Extract audio widgets from rendered content
const extractAudioWidgets = () => {
  console.log('🔍 Starting audio widget extraction')
  audioWidgets.value = []

  if (typeof document === 'undefined') {
    console.log('❌ Document is undefined, skipping extraction')
    return
  }

  const markdownContent = document.querySelector('.markdown-content')
  if (!markdownContent) {
    console.log('❌ No .markdown-content element found')
    return
  }

  // Look for audio widget placeholders in the rendered HTML
  const audioElements = markdownContent.querySelectorAll('.audio-widget')
  console.log(`🎵 Found ${audioElements.length} audio widget elements in DOM`)

  if (audioElements.length === 0) {
    console.log('🔍 No audio widgets found in DOM. Checking if markdown processing worked...')

    // Let's also check if the audio placeholders exist in the raw rendered content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = renderedContent.value
    const tempAudioElements = tempDiv.querySelectorAll('.audio-widget')
    console.log(`🔍 Found ${tempAudioElements.length} audio widgets in raw rendered content`)

    tempAudioElements.forEach((el, index) => {
      const fileId = el.getAttribute('data-file-id')
      const filename = el.getAttribute('data-filename')
      const audioUrl = el.getAttribute('data-audio-url')
      console.log(`🔍 Raw audio widget ${index}:`, { fileId, filename, audioUrl })
    })
  }

  audioElements.forEach((element, index) => {
    const fileId = element.getAttribute('data-file-id')
    const filename = element.getAttribute('data-filename')
    const audioUrl = element.getAttribute('data-audio-url')
    const sequence = element.getAttribute('data-sequence')

    console.log(`🔍 Audio widget ${index}:`, { fileId, filename, audioUrl, sequence })

    if (fileId && filename && audioUrl) {
      console.log(`🎧 Adding audio widget to array: ${filename}`)
      audioWidgets.value.push({
        fileId,
        filename,
        audioUrl,
        sequence: sequence ? parseInt(sequence) : undefined
      })

      // Create a marker element to show where the widget will be rendered
      const marker = document.createElement('div')
      marker.className = 'audio-widget-marker'
      marker.innerHTML = `🎧 Audio Widget: ${filename}`
      marker.style.cssText = `
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 4px;
        padding: 8px;
        margin: 8px 0;
        font-size: 0.8rem;
        color: #1565c0;
      `

      // Replace the placeholder with our marker
      element.parentNode?.replaceChild(marker, element)
      console.log(`📍 Replaced placeholder with marker for ${filename}`)
    } else {
      console.log('❌ Missing required attributes for audio widget:', { fileId, filename, audioUrl })
    }
  })

  console.log(`✅ Final audio widgets array:`, audioWidgets.value)

  // If no widgets found but we have audio files, create them directly
  if (audioWidgets.value.length === 0 && sequencedAudio.value.length > 0) {
    console.log('🔄 Creating audio widgets directly from sequencedAudio data')
    audioWidgets.value = sequencedAudio.value.map(audio => ({
      fileId: audio.fileId,
      filename: audio.filename,
      audioUrl: `/api/file/${audio.fileId}`,
      sequence: audio.sequence
    }))
    console.log(`✅ Created ${audioWidgets.value.length} audio widgets directly`)
  }
}

// Render markdown content
const renderMarkdownContent = async (content: string) => {
  console.log('📝 Starting markdown content rendering')
  console.log('📄 Input content length:', content.length)

  // Clear previous audio widgets
  audioWidgets.value = []
  console.log('🧹 Cleared previous audio widgets')

  // Process content to replace image and audio placeholders with actual URLs
  let processedContent = processMarkdownContent(content)
  console.log('📝 Processed content length:', processedContent.length)

  try {
    console.log('🔄 Parsing markdown with marked...')
    const rawHtml = await marked.parse(processedContent)
    console.log('✅ Markdown parsed successfully')

    console.log('🔄 Sanitizing HTML with DOMPurify...')
    renderedContent.value = DOMPurify.sanitize(rawHtml)
    console.log('✅ HTML sanitized successfully')
    console.log('📄 Rendered content:', renderedContent.value)

    console.log('⏳ Waiting for next tick...')
    await nextTick()
    console.log('✅ Next tick completed')

    // Extract audio widgets from the rendered content
    console.log('🔍 Extracting audio widgets from rendered content...')
    extractAudioWidgets()

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

    await nextTick()
    extractAudioWidgets()
  }
}

// Update your addCopyButtons to work with highlighted code
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
    console.log('🔄 Attached files updated, re-rendering markdown with images and audio')
    await renderMarkdownContent(props.postContent)
  }
}, { deep: true })
</script>

<template>
  <div class="markdown-content">
    <!-- Debug info -->
    <div v-if="audioWidgets.length > 0" class="debug-info">
      <p>🎵 Found {{ audioWidgets.length }} audio widgets to render</p>
      <div v-for="widget in audioWidgets" :key="widget.fileId" class="debug-widget-item">
        {{ widget.filename }}
      </div>
    </div>

    <!-- Main markdown content -->
    <div v-html="renderedContent"></div>

    <!-- Render actual audio widgets -->
    <div
      v-for="widget in audioWidgets"
      :key="widget.fileId"
      class="audio-widget-container"
    >
      <div class="debug-widget">
        🔧 Rendering AvWidget for: {{ widget.filename }}
      </div>
      <AvWidget
        :audio-url="widget.audioUrl"
        :filename="widget.filename"
        :file-id="widget.fileId"
        @download="handleDownload"
      />
    </div>

    <!-- Debug fallback -->
    <div v-if="audioWidgets.length === 0" class="debug-fallback">
      <p>❌ No audio widgets detected</p>
      <p>Audio files available: {{ audioFiles.length }}</p>
      <p>Sequenced audio: {{ sequencedAudio.length }}</p>
      <p>Additional audio: {{ additionalAudio.length }}</p>
      <p>Rendered content contains audio widgets: {{ renderedContent.includes('audio-widget') ? 'Yes' : 'No' }}</p>
    </div>
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

.debug-widget {
  background: color-mix(in oklab, #FF9800, transparent 90%);
  border: 1px solid #FF9800;
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
  font-size: 0.8rem;
  color: #E65100;
}

.debug-fallback {
  background: color-mix(in oklab, #f44336, transparent 90%);
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
  font-size: 0.8rem;
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

/* Audio widget container styling */
.audio-widget-container {
  margin: 2em auto;
  max-width: 600px;
}

/* Audio widget placeholder styling (fallback) */
.markdown-content :deep(.audio-widget) {
  margin: 2em auto;
  max-width: 600px;
  text-align: center;
  padding: 1em;
  background: color-mix(in oklab, var(--background), var(--text) 5%);
  border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--background), var(--text) 20%);
  color: color-mix(in oklab, var(--text), transparent 30%);
}

.markdown-content :deep(.audio-widget-marker) {
  margin: 2em auto;
  max-width: 600px;
  text-align: center;
  padding: 1em;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 10px;
  color: #1565c0;
}
</style>
