<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useTheme } from '@/composables/useTheme' // Import the theme composable
import "@/assets/syntaxHighlighting.css"

interface AttachedFile {
  filename: string
  fileId: string
  uploadDate: string
  fileType?: string
  sequence?: number
}

interface Props {
  postContent: string
  attachedFiles: AttachedFile[]
}

const props = defineProps<Props>()
const renderedContent = ref('')
const hljs = ref<any>(null)
const { isDarkMode } = useTheme() // Get theme state


// Configure marked
const configureMarked = () => {
  marked.setOptions({
    breaks: true,
    gfm: true,
  })
}

// Initialize marked configuration
configureMarked()


// Render markdown content
const renderMarkdownContent = async (content: string) => {
  console.log('📝 Rendering markdown content...')
  console.log('📄 Original content:', content)

  // Process content to replace image placeholders with actual URLs
  let processedContent = processMarkdownContent(content)

  try {
    const rawHtml = await marked.parse(processedContent)
    renderedContent.value = DOMPurify.sanitize(rawHtml)

    console.log('🔍 Rendered HTML sample:', renderedContent.value.substring(0, 500))

    await nextTick()

    // Apply syntax highlighting after the content is rendered
    if (hljs.value) {
      document.querySelectorAll('.markdown-content pre code').forEach((block) => {
        hljs.value.highlightElement(block)
      })
    }

    addCopyButtons()
  } catch (err) {
    console.error('Error rendering markdown:', err)
    // Fallback: render without highlighting but still with image processing
    renderedContent.value = DOMPurify.sanitize(processedContent)
  }
}

// Update your addCopyButtons to work with highlighted code
const addCopyButtons = () => {
  const preElements = document.querySelectorAll('.markdown-content pre')
  preElements.forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return

    const code = pre.querySelector('code')
    if (!code) return

    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-btn'
    copyBtn.textContent = 'Copy'
    copyBtn.onclick = async () => {
      try {
        // Get the raw text content, not the highlighted HTML
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

// Get sequenced images (images with sequence numbers)
const sequencedImages = computed(() => {
  if (!props.attachedFiles) return []

  const sequenced = props.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence !== undefined
  )

  return sequenced.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
})

// Get additional images (images without sequence numbers)
const additionalImages = computed(() => {
  if (!props.attachedFiles) return []

  const additional = props.attachedFiles.filter(file =>
    file.fileType === 'image' && file.sequence === undefined
  )

  return additional.sort((a, b) =>
    new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
  )
})

// CRITICAL: Process markdown content to replace image placeholders with actual image URLs
const processMarkdownContent = (content: string) => {
  let processedContent = content

  console.log('🖼️ Starting image processing...')
  console.log('📊 Sequenced images:', sequencedImages.value.map(img => ({
    filename: img.filename,
    sequence: img.sequence,
    fileId: img.fileId
  })))

  // First, replace numbered image placeholders (image1, image2, etc.)
  // Handle BOTH markdown image syntax ![alt](image1) AND link syntax [alt](image1)
  sequencedImages.value.forEach((image, index) => {
    const imageNumber = index + 1
    const imageUrl = `/api/file/${image.fileId}`

    // Pattern for markdown images: ![alt text](image1)
    const imagePattern = new RegExp(`!\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'gi')

    // Pattern for links that should be images: [alt text](image1)
    const linkPattern = new RegExp(`\\[([^\\]]*)\\]\\(image${imageNumber}\\)`, 'gi')

    // Replace markdown images
    processedContent = processedContent.replace(
      imagePattern,
      `![$1](${imageUrl})`
    )

    // Replace links that should be images (convert to proper image syntax)
    processedContent = processedContent.replace(
      linkPattern,
      `![$1](${imageUrl})`
    )
  })

  // Then, handle any remaining image references that might match filenames
  const genericImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  const genericLinkPattern = /\[([^\]]*)\]\(([^)]+)\)/g

  // First process proper image syntax
  processedContent = processedContent.replace(genericImagePattern, (match, altText, src) => {
    // Skip if it's already a full URL or API path
    if (src.startsWith('http') || src.startsWith('/api/file/') || src.startsWith('data:')) {
      return match
    }

    // Check if this src matches any uploaded image filename
    const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
      img => img.filename === src || img.filename.includes(src)
    )

    if (matchingImage) {
      return `![${altText}](/api/file/${matchingImage.fileId})`
    }

    // Return original if no match found
    return match
  })

  // Then process links that might be intended as images
  processedContent = processedContent.replace(genericLinkPattern, (match, altText, src) => {
    // Skip if it's already a full URL or API path
    if (src.startsWith('http') || src.startsWith('/api/file/') || src.startsWith('data:')) {
      return match
    }

    // Check if this looks like an image reference (image1, image2, etc.)
    if (src.match(/^image\d+$/)) {
      // This should have been handled by the numbered image processing above
      return match
    }

    // Check if this src matches any uploaded image filename
    const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
      img => img.filename === src || img.filename.includes(src)
    )

    // If we found a matching image, convert the link to an image
    if (matchingImage) {
      return `![${altText}](/api/file/${matchingImage.fileId})`
    }

    // Return original link if no image match found
    return match
  })

  console.log('✅ Image processing completed')
  console.log('📝 Processed content sample:', processedContent.substring(0, 500))

  return processedContent
}

// Load highlight.js dynamically
const loadHighlightJS = async () => {
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


  // Re-render the markdown content to apply the new highlighting style
  if (props.postContent) {
    await renderMarkdownContent(props.postContent)
  }
})

onMounted(async () => {
  await loadHighlightJS()
  if (props.postContent) {
    await renderMarkdownContent(props.postContent)
  }
})

watch(() => props.postContent, async (newContent) => {
  if (newContent) {
    await renderMarkdownContent(newContent)
  }
})

// Also watch for attachedFiles changes in case they load after content
watch(() => props.attachedFiles, async (newFiles) => {
  if (newFiles && props.postContent) {
    console.log('🔄 Attached files updated, re-rendering markdown with images')
    await renderMarkdownContent(props.postContent)
  }
}, { deep: true })
</script>

<template>
  <div
    class="markdown-content"
    v-html="renderedContent"
  ></div>
</template>

<style scoped>
.markdown-content {
  line-height: 1.7;
  color: var(--text);
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
  margin: 0 auto; /* Center the image */
  text-indent: 0; /* Reset text-indent */
  border: solid 2.5px;
  border-radius: 10px;
  border-color: color-mix(in oklab, var(--background), var(--text) 25%);
  display: block; /* Ensure images are block-level elements */
}

/* Specifically target images that are inside paragraphs */
.markdown-content :deep(p > img) {
  text-indent: 0;
  margin: 1em auto; /* Maintain vertical spacing but center horizontally */
}
</style>
