<template>
  <button @click="downloadFile">Download File</button>
</template>

<script lang="ts">
import axios from 'axios'

export default {
  methods: {
    downloadFile() {
      axios({
        url: `/download/${this.filename}`, // Replace with your filename
        method: 'GET',
        responseType: 'blob',
      }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', this.filename)
        document.body.appendChild(link)
        link.click()
      })
    },
  },
}
</script>
