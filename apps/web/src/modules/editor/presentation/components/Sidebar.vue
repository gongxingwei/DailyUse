<!-- <template>
  <div class="sidebar custom-border" v-show="store.isSidebarVisible" :style="{
    'grid-column': store.isSidebarVisible ? '2' : 'auto',
    'display': store.isSidebarVisible ? 'block' : 'none'
  }">
    <component :is="store.activeActivityBarItem.component" v-if="store.activeActivityBarItem"
      :root-path="repositoryStore.currentRepositoryPath()" />
  </div>
</template>

<script setup lang="ts">

import { useActivityBarStore } from '../stores/activityBarStore';
import { useRepositoryStore } from '@/modules/repository/presentation/stores/repositoryStore';

const store = useActivityBarStore();
const repositoryStore = useRepositoryStore();
</script>

<style scoped></style> -->
