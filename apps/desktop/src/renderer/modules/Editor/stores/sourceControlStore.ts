import { defineStore } from 'pinia'
import { GitStatus, GiApiResponse, GitLogResponse } from '@renderer/shared/types/git'

interface GitState {
  isGitRepo: boolean;
  currentBranch: string;
  tracking: string;
  ahead: number;
  behind: number;
  changes: {
    staged: string[];
    unstaged: string[];
    not_added: string[];
    created: string[];
    modified: string[];
    deleted: string[];
    conflicted: string[];
  };
  isClean: boolean;
  detached: boolean;
  loading: boolean;
  error: string | null;
}

declare global {
  interface Window {
    git: {
      initialize: (workingDirectory: string) => Promise<GiApiResponse>
      getStatus: () => Promise<GiApiResponse>
      init: (workingDirectory: string) => Promise<boolean>
      checkIsRepo: (workingDirectory: string) => Promise<boolean>
      add: (files: string[]) => Promise<void>
      stage: (files: string[]) => Promise<void>
      unstage: (files: string[]) => Promise<void>
      commit: (message: string) => Promise<void>
      onStatusChanged: (callback: (status: GiApiResponse) => void) => void
      stageAll: () => Promise<void>
      unstageAll: () => Promise<void>
      discardAll: () => Promise<void>
      getCommitHistory: () => Promise<GiApiResponse>
      getLog: () => Promise<GitLogResponse>
    }
  }
}

export const useSourceControlStore = defineStore('sourceControl', {
  state: (): GitState => ({
    isGitRepo: false,
    currentBranch: '',
    tracking: '',
    ahead: 0,
    behind: 0,
    changes: {
      staged: [],
      unstaged: [],
      not_added: [],
      created: [],
      modified: [],
      deleted: [],
      conflicted: []
    },
    isClean: true,
    detached: false,
    loading: false,
    error: null
  }),

  actions: {
    async checkIsRepo(workingDirectory: string) {
      try {
        this.isGitRepo = await window.git.checkIsRepo(workingDirectory)
        return this.isGitRepo
      } catch (error) {
        this.error = 'Failed to check if repo'
        return false
      }
    },

    async initRepo(workingDirectory: string) {
      try {
        const success = await window.git.init(workingDirectory)
        if (success) {
          this.isGitRepo = true
          await this.initializeGit(workingDirectory)
        }
        return success
      } catch (error) {
        this.error = 'Failed to initialize repository'
        return false
      }
    },

    async initializeGit(workingDirectory: string) {
      try {
        const response = await window.git.initialize(workingDirectory)
        if (response.success && response.data) {
          this.isGitRepo = true
          this.currentBranch = response.data.current || ''
          this.updateStatus(response.data)
          // 添加状态变化监听
          window.git.onStatusChanged((status) => {
            if (status.success && status.data) {
              this.updateStatus(status.data)
            }
          })
        } else {
          throw new Error(response.error || 'Failed to initialize')
        }
      } catch (error) {
        this.error = 'Not a git repository'
        this.isGitRepo = false
      }
    },
    updateStatus(data: GitStatus) {
      this.currentBranch = data.current || ''
      this.tracking = data.tracking || ''
      this.ahead = data.ahead || 0
      this.behind = data.behind || 0
      this.changes = {
        staged: data.staged || [],
        unstaged: data.modified || [],
        not_added: data.not_added || [],
        created: data.created || [],
        modified: data.modified || [],
        deleted: data.deleted || [],
        conflicted: data.conflicted || []
      }
      this.isClean = data.isClean || false
      this.detached = data.detached || false
    },
    async refreshStatus() {
      if (!this.isGitRepo) return

      try {
        this.loading = true
        const response = await window.git.getStatus()
        console.log(response)
        if (response.success && response.data) {
          this.changes = {
            staged: response.data.staged || [],
            unstaged: response.data.modified || [],
            not_added: response.data.not_added || [],
            created: response.data.created || [],
            modified: response.data.modified || [],
            deleted: response.data.deleted || [],
            conflicted: response.data.conflicted || []
          }
          this.currentBranch = response.data.current || ''
        } else {
          throw new Error(response.error || 'Failed to get status')
        }
      } catch (error) {
        this.error = 'Failed to get git status'
      } finally {
        this.loading = false
      }
    },
    async addFile(file: string) {
      try {
        await window.git.add([file])
        await this.refreshStatus()
      } catch (error) {
        this.error = `Failed to add file: ${file}`
      }
    },

    async addAllUntracked() {
      try {
        // Add all untracked files
        if (this.changes.not_added.length > 0) {
          await window.git.add(this.changes.not_added)
          await this.refreshStatus()
        }
      } catch (error) {
        this.error = 'Failed to add untracked files'
      }
    },
    async stageFile(file: string) {
      try {
        await window.git.stage([file])
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to stage file'
      }
    },

    async unstageFile(file: string) {
      try {
        await window.git.unstage([file])
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to unstage file'
      }
    },

    async commit(message: string) {
      try {
        await window.git.commit(message)
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to commit changes'
      }
    },

    async stageAllChanges() {
      try {
        await window.git.stageAll()
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to stage all changes'
      }
    },

    async unstageAllChanges() {
      try {
        await window.git.unstageAll()
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to unstage all changes'
      }
    },

    async discardAllChanges() {
      try {
        await window.git.discardAll()
        await this.refreshStatus()
      } catch (error) {
        this.error = 'Failed to discard changes'
      }
    },
    
    async getCommitHistory() {
      try {
        const response = await window.git.getLog()
        if (response.success && response.data) {
          return response.data.commits
        }
        return []
      } catch (error) {
        this.error = 'Failed to get commit history'
        return []
      }
    },

    setIsRepo(isRepo: boolean) {
      this.isGitRepo = isRepo
    }
  }
})
