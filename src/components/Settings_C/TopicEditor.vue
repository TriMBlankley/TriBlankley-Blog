<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  const getSessionToken = () => {
    return localStorage.getItem('settingsSessionToken');
  }

  interface Topic {
    topicColor: string;
    topicName: string;
    topicOrder: number;
  }

  const topics = ref<Topic[]>([]);
  const editingIndex = ref<number | null>(null);
  const form = ref<Topic>({
    topicColor: '#000000',
    topicName: '',
    topicOrder: 0
  });

  // Fetch topics from the API
  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      const data = await response.json();
      topics.value = data.sort((a: any, b: any) => a.topicOrder - b.topicOrder);
    } catch (error) {
      console.error('Error in fetchTopics:', error);
    }
  };

  // Save topics to the API - FIXED: Use getSessionToken() directly, not this.getSessionToken()
  const saveTopics = async () => {
  try {
    const sessionToken = getSessionToken() || ''; // Provide empty string as default
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken // Now it's always a string
      },
      body: JSON.stringify(topics.value)
    });
    if (!response.ok) throw new Error('Failed to save topics');
  } catch (error) {
    console.error('Error saving topics:', error);
  }
};

  // Add or update a topic
  const submitTopic = async () => {
    if (!form.value.topicName || !form.value.topicColor || form.value.topicOrder === null) {
      alert('Please fill all required fields');
      return;
    }

    if (editingIndex.value !== null) {
      topics.value[editingIndex.value] = {...form.value};
    } else {
      topics.value.push({...form.value});
    }

    await saveTopics();
    resetForm();
  };

  // Edit a topic
  const editTopic = (index: number) => {
    form.value = {...topics.value[index]};
    editingIndex.value = index;
  };

  // Delete a topic
  const deleteTopic = async (index: number) => {
    topics.value.splice(index, 1);
    if (editingIndex.value === index) {
      resetForm();
    }
    await saveTopics();
  };

  // Reset the form
  const resetForm = () => {
    form.value = {
      topicColor: '#000000',
      topicName: '',
      topicOrder: topics.value.length > 0 ?
        Math.max(...topics.value.map(t => t.topicOrder)) + 1 : 0
    };
    editingIndex.value = null;
  };

  // Fetch topics when component mounts
  onMounted(fetchTopics);
  </script>

  <template>
    <!-- Template remains the same -->
    <div class="blogEditor">
      <div class="editorContainer">
        <h2>Topic Management</h2>

        <!-- Topic Form -->
        <div class="topicForm">
          <div class="formGroup">
            <label for="topicName">Topic Name *</label>
            <input
              id="topicName"
              v-model="form.topicName"
              type="text"
              placeholder="Enter topic name"
              required
            >
          </div>

          <div class="formGroup">
            <label for="topicColor">Topic Color *</label>
            <input
              id="topicColor"
              v-model="form.topicColor"
              type="color"
              required
            >
          </div>

          <div class="formGroup">
            <label for="topicOrder">Order *</label>
            <input
              id="topicOrder"
              v-model.number="form.topicOrder"
              type="number"
              min="0"
              required
            >
          </div>

          <div class="formActions">
            <button @click="submitTopic" class="submitBtn">
              {{ editingIndex !== null ? 'Update' : 'Add' }} Topic
            </button>
            <button
              v-if="editingIndex !== null"
              @click="resetForm"
              class="cancelBtn"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Topics List -->
        <div class="topicsList">
          <h3>Existing Topics</h3>
          <div v-if="topics.length === 0" class="emptyMessage">
            No topics added yet.
          </div>
          <ul v-else>
            <li v-for="(topic, index) in topics" :key="index" class="topicItem">
              <div class="topicInfo">
                <span
                  class="colorIndicator"
                  :style="{ backgroundColor: topic.topicColor }"
                ></span>
                <span class="topicName">{{ topic.topicName }}</span>
                <span class="topicOrder">(Order: {{ topic.topicOrder }})</span>
              </div>
              <div class="topicActions">
                <button @click="editTopic(index)" class="editBtn">Edit</button>
                <button @click="deleteTopic(index)" class="deleteBtn">Delete</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>

  <style>
  /* Styles remain the same */
  .blogEditor {
    height: 100%;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
    /* background-color: #f5f5f5; */
    display: flex;
    flex-direction: column;
  }

  .editorContainer {
    max-width: 800px;
    margin: 0 auto;
    /* background: white; */
    padding: 20px;
    border-radius: 8px;
    /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */
  }

  /* ... rest of the styles ... */
  </style>

<style>
/* Styles remain the same as before */
.blogEditor {
  height: 100%;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
}

.editorContainer {
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--background);
  padding: 20px;
  border-radius: 8px;
}

/* ... rest of the styles ... */
</style>
