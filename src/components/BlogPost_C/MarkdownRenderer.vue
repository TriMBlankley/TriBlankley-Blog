<script setup lang="ts">
  import { ref, onMounted, watch, nextTick, computed, h, createApp } from 'vue'
  import type { App, FunctionalComponent, SVGAttributes } from 'vue'

  import { marked } from 'marked'
  import DOMPurify from 'dompurify'

  import "@/assets/syntaxHighlighting.css"
  import { useTheme } from '@/composables/useTheme'

  import CopyIcon from "@/assets/uiElements/copy.svg";
  import XButton from "@/assets/uiElements/xButton.svg";
  import CheckIcon from "@/assets/uiElements/check.svg";

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

  // Configure marked
  const configureMarked = () => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
  }

  // Initialize marked configuration
  configureMarked()
  
  // Process markdown content to replace image, audio, and video placeholders
  const processMarkdownContent = (content: string) => {
    console.log('🔄 Starting markdown content processing')
    console.log('📄 Original content:', content)

    let processedContent = content

    console.log('🖼️ Sequenced images available:', sequencedImages.value)


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

      const matchingImage = [...sequencedImages.value, ...additionalImages.value].find(
        img => img.filename === src || img.filename.includes(src)
      )

      if (matchingImage) {
        console.log(`🖼️ Converting link to image for "${src}":`, matchingImage.filename)
        return `![${altText}](/api/file/${matchingImage.fileId})`
      }

      return match
    })

    console.log('✅ Final processed content:', processedContent)
    return processedContent
  }




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

  // Then in your addCopyButtons function, fix the types:
  const addCopyButtons = () => {
    const preElements = document.querySelectorAll('.markdown-content pre')
    console.log(`📋 Found ${preElements.length} pre elements for copy buttons`)

    preElements.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return

      const code = pre.querySelector('code')
      if (!code) return

      // Create button container
      const copyBtn = document.createElement('button')
      copyBtn.className = 'copy-btn'
      copyBtn.setAttribute('aria-label', 'Copy code')

      // Create a wrapper div for the Vue component
      const iconContainer = document.createElement('div')
      copyBtn.appendChild(iconContainer)

      // Store reference to the current app with proper type
      let currentApp: App | null = null

      // Function to mount an icon with proper type
      const mountIcon = (IconComponent: FunctionalComponent<SVGAttributes>) => {
        // Unmount previous app if exists
        if (currentApp) {
          currentApp.unmount()
        }

        // Clear container
        iconContainer.innerHTML = ''

        // Create and mount new app
        currentApp = createApp({
          render() {
            return h(IconComponent, { width: 16, height: 16 })
          }
        })

        currentApp.mount(iconContainer)
      }

      // Cast the SVG imports to FunctionalComponent
      const CopyIconComponent = CopyIcon as unknown as FunctionalComponent<SVGAttributes>
      const CheckIconComponent = CheckIcon as unknown as FunctionalComponent<SVGAttributes>
      const XButtonComponent = XButton as unknown as FunctionalComponent<SVGAttributes>

      // Mount initial CopyIcon
      mountIcon(CopyIconComponent)

      copyBtn.onclick = async () => {
        try {
          const textToCopy = code.textContent || ''
          await navigator.clipboard.writeText(textToCopy)

          // Change to success icon (CheckIcon)
          mountIcon(CheckIconComponent)
          copyBtn.setAttribute('aria-label', 'Copied!')

          setTimeout(() => {
            // Return to original icon
            mountIcon(CopyIconComponent)
            copyBtn.setAttribute('aria-label', 'Copy code')
          }, 2000)
        } catch (err) {
          console.error('Failed to copy code:', err)

          // Change to error icon (XButton)
          mountIcon(XButtonComponent)
          copyBtn.setAttribute('aria-label', 'Failed to copy')

          setTimeout(() => {
            // Return to original icon
            mountIcon(CopyIconComponent)
            copyBtn.setAttribute('aria-label', 'Copy code')
          }, 2000)
        }
      }

      // Cast to HTMLElement to access style property
      (pre as HTMLElement).style.position = 'relative'
      pre.appendChild(copyBtn)
    })
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
      <div v-html="renderedContent"></div>
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

  .markdown-content :deep(.copy-btn) {
    height: 3em;
    width: 3em;
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 6px 6px;
    background: color-mix(in oklab, var(--focused), transparent 0%);
    color: var(--text);
    border: none;
    border-radius: 5px;
    font-size: 12px;
    cursor: pointer;
    opacity: 0.66;
    transition: opacity 0.2s ease;
    z-index: 10;
  }

  .markdown-content :deep(.copy-btn:hover) {
    opacity: 1;
    background: var(--focused);
  }

  /* Hide the media markers in the final output */
  .markdown-content :deep(.audio-widget-marker),
  .markdown-content :deep(.video-widget-marker) {
    display: none;
  }

  @media (min-width: 1250px) {
    .video-widget-container {
      margin: 2em auto;
      max-width: 85vw;
    }
  }
  </style>
