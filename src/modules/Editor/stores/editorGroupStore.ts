import { defineStore } from 'pinia'
import { useEditorLayoutStore } from './editorLayoutStore'

export interface EditorTab {
    id: string
    title: string
    path: string
    active: boolean
    isPreview?: boolean;
}

export interface EditorGroup {
    id: string
    active: boolean
    width: number
    tabs: EditorTab[]
    activeTabId: string | null
}

export const useEditorGroupStore = defineStore('editorGroup', {
    state: () => { 
        const layoutStore = useEditorLayoutStore()
        return {
            editorGroups: [
                { 
                    id: 'group-1', 
                    active: true, 
                    width: layoutStore.editorGroupsWidth,
                    tabs: [],
                    activeTabId: null
                }
            ] as EditorGroup[],
            activeGroupId: 'group-1' as string | null
        }
    },

    getters: {
        totalWidth(): number {
            return this.editorGroups.reduce((sum, group) => sum + group.width, 0)
        }
    },

    actions: {
        openFile(path: string, groupId?: string) {
            const title = window.shared.path.basename(path)
            const targetGroupId = groupId || this.activeGroupId
            if (!targetGroupId) {
                const newGroup = this.addEditorGroup()
                this.openFile(path, newGroup.id)
                return
            }

            const group = this.editorGroups.find(g => g.id === targetGroupId)
            if (!group) return

            // 检查文件是否已在此组中打开
            const existingTab = group.tabs.find(t => t.path === path)
            if (existingTab) {
                this.setActiveTab(targetGroupId, existingTab.id)
                return
            }

            // 创建新标签页
            const newTab: EditorTab = {
                id: path, // 使用路径作为唯一标识
                title,
                path,
                active: true,
            }

            // 取消其他标签页的活动状态
            group.tabs.forEach(t => t.active = false)
            group.tabs.push(newTab)
            group.activeTabId = newTab.id

            // 激活当前组
            this.setActiveGroup(targetGroupId)
        },

        openFilePreview(path: string, groupId: string) {
            const title = `Preview: ${window.shared.path.basename(path)}`
            const group = this.editorGroups.find(g => g.id === groupId)
            if (!group) return

            // 检查是否已有预览标签页
            const existingPreview = group.tabs.find(t => t.path === path && t.isPreview)
            if (existingPreview) {
                this.setActiveTab(groupId, existingPreview.id)
                return
            }

            // 创建新的预览标签页
            const previewTab: EditorTab = {
                id: `preview-${path}`,
                title,
                path,
                active: true,
                isPreview: true
            }

            group.tabs.forEach(t => t.active = false)
            group.tabs.push(previewTab)
            group.activeTabId = previewTab.id
        },

        // 关闭标签页
        closeTab(groupId: string, tabId: string) {
            const group = this.editorGroups.find(g => g.id === groupId)
            if (!group) return

            const tabIndex = group.tabs.findIndex(t => t.id === tabId)
            if (tabIndex === -1) return

            group.tabs.splice(tabIndex, 1)

            // 如果关闭的是活动标签页，激活下一个标签页
            if (tabId === group.activeTabId) {
                const nextTab = group.tabs[tabIndex] || group.tabs[tabIndex - 1]
                group.activeTabId = nextTab?.id || null
            }

            // 如果没有标签页了，关闭编辑器组
            if (group.tabs.length === 0) {
                this.removeEditorGroup(groupId)
            }
        },

        // 添加用于查找标签页的 getter
        findTab(path: string) {
            for (const group of this.editorGroups) {
                const tab = group.tabs.find(t => t.path === path)
                if (tab) {
                    return { group, tab }
                }
            }
            return null
        },
        
        // 设置活动标签页
        setActiveTab(groupId: string, tabId: string) {
            const group = this.editorGroups.find(g => g.id === groupId)
            if (!group) return

            group.tabs.forEach(t => t.active = t.id === tabId)
            group.activeTabId = tabId
        },

        addEditorGroup() {
            // 没有编辑器组时创建初始组
            if (this.editorGroups.length === 0) {
                const layoutStore = useEditorLayoutStore()
                const initialGroup: EditorGroup = {
                    id: `group-${Date.now()}`,
                    active: true,
                    width: layoutStore.editorGroupsWidth,
                    tabs: [],
                    activeTabId: null
                }
                this.editorGroups.push(initialGroup)
                this.activeGroupId = initialGroup.id
                return initialGroup
            }

            const currentGroup = this.editorGroups.find(g => g.id === this.activeGroupId)
            const activeTab = currentGroup?.tabs.find(t => t.id === currentGroup.activeTabId)

            const newGroup: EditorGroup = {
                id: `group-${Date.now()}`,
                active: true,
                width: 300,
                tabs: [],
                activeTabId: null
            }

            // 如果当前组有活动的标签页，复制到新组
            if (activeTab) {
                const newTab = { ...activeTab }
                newGroup.tabs = [newTab]
                newGroup.activeTabId = newTab.id
            }

            // 设置活动状态
            if (this.activeGroupId) {
                const currentActive = this.editorGroups.find(g => g.id === this.activeGroupId)
                if (currentActive) {
                    currentActive.active = false
                }
            }

            this.editorGroups.push(newGroup)
            this.activeGroupId = newGroup.id
            this.redistributeWidths()
            return newGroup
        },

        addEditorGroupPreview() {
            const currentGroup = this.editorGroups.find(g => g.id === this.activeGroupId)


            const newGroup: EditorGroup = {
                id: `group-${Date.now()}`,
                active: true,
                width: 300,
                tabs: [],
                activeTabId: null
            }

            // 设置活动状态
            if (this.activeGroupId) {
                const currentActive = this.editorGroups.find(g => g.id === this.activeGroupId)
                if (currentActive) {
                    currentActive.active = false
                }
            }

            this.editorGroups.push(newGroup)
            this.activeGroupId = newGroup.id
            this.redistributeWidths()
            return newGroup
        },

        // 移除编辑器组
        removeEditorGroup(groupId: string) {
            const index = this.editorGroups.findIndex(g => g.id === groupId)
            if (index === -1) return

            const removedGroup = this.editorGroups[index]
            const removedGroupWidth = removedGroup.width

            this.editorGroups.splice(index, 1)

            // 如果删除的是当前活动组，激活前一个组
            if (this.activeGroupId === groupId) {
                const previousGroup = this.editorGroups[index - 1] || this.editorGroups[0]
                if (previousGroup) {
                    previousGroup.active = true
                    this.activeGroupId = previousGroup.id
                } else {
                    this.activeGroupId = null
                }
            }

            // 重新分配宽度
            this.redistributeWidths(removedGroupWidth)
        },

        setActiveGroup(groupId: string) {
            if (this.activeGroupId !== groupId) {
                const currentActive = this.editorGroups.find(g => g.id === this.activeGroupId)
                if (currentActive) {
                    currentActive.active = false
                }
                
                const newActive = this.editorGroups.find(g => g.id === groupId)
                if (newActive) {
                    newActive.active = true
                    this.activeGroupId = groupId
                }
            }
        },

        getGroupWidth(groupId: string) {
            const group = this.editorGroups.find(g => g.id === groupId)
            return group?.width || 300
        },
        
        redistributeWidths(removedGroupWidth?: number) {
            const remainingGroups = this.editorGroups.length
            if (remainingGroups === 0) return

            if (removedGroupWidth && remainingGroups > 0) {
                // 将关闭窗口的宽度分配给前一个窗口
                const widthPerGroup = removedGroupWidth / remainingGroups
                this.editorGroups.forEach(group => {
                    group.width += widthPerGroup
                })
            } else {
                // 平均分配总宽度
                const layoutStore = useEditorLayoutStore()
                const totalWidth = layoutStore.editorGroupsWidth
                const widthPerGroup = Math.max(layoutStore.minEditorWidth, totalWidth / remainingGroups)
                this.editorGroups.forEach(group => {
                    group.width = widthPerGroup
                })
            }
        },

        setGroupWidth(groupId: string, width: number) {
            const group = this.editorGroups.find(g => g.id === groupId)
            if (group) {
                group.width = Math.max(200, width) // 确保最小宽度
            }
        }
    },

    persist: true
})