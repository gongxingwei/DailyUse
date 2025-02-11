import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface EditorGroup {
  id: string
  filePath: string | null
  viewMode: 'edit' | 'preview' | 'split'
  active: boolean
}

export const useEditorGroupStore = defineStore('editorGroup', () => {
  const editorGroups = ref<EditorGroup[]>([])
  const activeGroupId = ref<string | null>(null)

  function addEditorGroup(filePath: string | null = null) {
    const newGroup: EditorGroup = {
      id: `group-${Date.now()}`,
      filePath,
      viewMode: 'edit',
      active: true
    }
    
    // 将当前活动组设为非活动
    if (activeGroupId.value) {
      const currentActive = editorGroups.value.find(g => g.id === activeGroupId.value)
      if (currentActive) {
        currentActive.active = false
      }
    }
    
    editorGroups.value.push(newGroup)
    activeGroupId.value = newGroup.id
    return newGroup.id
  }

  function removeEditorGroup(groupId: string) {
    const index = editorGroups.value.findIndex(g => g.id === groupId)
    if (index !== -1) {
      editorGroups.value.splice(index, 1)
      if (activeGroupId.value === groupId) {
        activeGroupId.value = editorGroups.value[0]?.id || null
      }
    }
  }

  return {
    editorGroups,
    activeGroupId,
    addEditorGroup,
    removeEditorGroup
  }
})