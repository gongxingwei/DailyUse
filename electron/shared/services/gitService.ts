import { GitResponse, GitLogResponse } from '@/shared/types/git'
import simpleGit, { SimpleGit } from 'simple-git'
import chokidar, { FSWatcher } from 'chokidar'
import { ipcMain } from 'electron'

class GitService {
  private git: SimpleGit | null = null
  private watcher: FSWatcher | null = null
  private workingDirectory: string = ''

  private initializeWatcher() {
    // 清理现有的 watcher
    if (this.watcher) {
      this.watcher.close()
    }

    // 创建新的 watcher
    this.watcher = chokidar.watch(this.workingDirectory, {
      ignored: [
        /(^|[\/\\])\../, // 忽略隐藏文件
        '**/node_modules/**',
        '**/.git/**'
      ],
      persistent: true
    })

    // 监听所有相关的文件事件
    this.watcher
      .on('add', () => this.notifyChanges())
      .on('change', () => this.notifyChanges())
      .on('unlink', () => this.notifyChanges())

    console.log(`Watching for file changes in ${this.workingDirectory}`)
  }

  private async notifyChanges() {
    // 延迟执行以避免频繁更新
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.debounceTimeout = setTimeout(async () => {
      const status = await this.getStatus()
      // 通知渲染进程
      ipcMain.emit('git:status-changed', status)
    }, 300)
  }

  private debounceTimeout: NodeJS.Timeout | null = null

  dispose() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
  }

  async getStatus(): Promise<GitResponse> {
    if (!this.git) {
      return {
        success: false,
        error: 'Git not initialized'
      }
    }
  
    try {
      const status = await this.git.status([
        '--untracked-files=all',
        '--ignored=no',
        '--porcelain=v1'
      ])
      const isClean = status.isClean()
      return {
        success: true,
        data: {
          current: status.current || '',
          tracking: status.tracking || '',
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          not_added: status.not_added,
          created: status.created,
          modified: status.modified,
          deleted: status.deleted,
          conflicted: status.conflicted,
          files: status.files,
          isClean: isClean,
          detached: status.detached,

        }
      }
    } catch (error) {
      console.error('Git status error:', error)
      return {
        success: false,
        error: 'Failed to get status'
      }
    }
  }
  
  async initialize(workingDirectory: string): Promise<GitResponse> {
    try {
      this.git = simpleGit(workingDirectory)
      const isRepo = await this.git.checkIsRepo()
      this.workingDirectory = workingDirectory
      
      this.initializeWatcher()
  
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository'
        }
      }
  
      const status = await this.git.status([
        '--untracked-files=all',
        '--ignored=no',
        '--porcelain=v1'
      ])
      const isClean = status.isClean()
      return {
        success: true,
        data: {
          current: status.current || '',
          tracking: status.tracking || '',
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          not_added: status.not_added,
          created: status.created,
          modified: status.modified,
          deleted: status.deleted,
          conflicted: status.conflicted,
          files: status.files,
          isClean: isClean,
          detached: status.detached,
        }
      }
    } catch (error) {
      console.error('Git initialization error:', error)
      return {
        success: false,
        error: 'Failed to initialize git'
      }
    }
  }
  async checkIsRepo(workingDirectory: string) {
    try {
      const tempGit = simpleGit(workingDirectory)
      return await tempGit.checkIsRepo()
    } catch (error) {
      console.error('Failed to check git repository:', error)
      return false
    }
  }
  async initRepo(workingDirectory: string) {
    try {
      const git = simpleGit(workingDirectory)
      await git.init()
      this.git = git
      return true
    } catch (error) {
      console.error('Failed to initialize repository:', error)
      return false
    }
  }
  async add(files: string[]) {
    if (!this.git) throw new Error('Git not initialized')
    await this.git.add(files)
    await this.notifyChanges()
  }
  async stage(files: string[]) {
    if (!this.git) throw new Error('Git not initialized')
    return await this.git.add(files)
  }

  async unstage(files: string[]) {
    if (!this.git) throw new Error('Git not initialized')
    return await this.git.reset(['--', ...files])
  }

  async commit(message: string) {
    if (!this.git) throw new Error('Git not initialized')
    return await this.git.commit(message)
  }

  async stageAll() {
    if (!this.git) throw new Error('Git not initialized')
    await this.git.add('.')
  }

  async unstageAll(): Promise<GitResponse> {
    if (!this.git) {
      return { success: false, error: 'Git not initialized' }
    }
  
    try {
      // 检查是否有任何提交
      const hasCommits = await this.hasCommits()
      
      if (hasCommits) {
        // 如果有提交历史，使用 HEAD
        await this.git.reset(['HEAD'])
      } else {
        // 如果是新仓库，直接重置暂存区
        await this.git.reset()
      }
      
      return { success: true }
    } catch (error) {
      console.error('Git unstage all error:', error)
      return { success: false, error: 'Failed to unstage all changes' }
    }
  }
  
  // 添加辅助方法检查是否有提交
  private async hasCommits(): Promise<boolean> {
    try {
      if (!this.git) return false
      const log = await this.git.log(['--oneline'])
      return log.total > 0
    } catch (error) {
      return false
    }
  }

  async discardAll() {
    if (!this.git) throw new Error('Git not initialized')
    await this.git.checkout(['--', '.'])
  }

  async getLog(): Promise<GitLogResponse> {
    if (!this.git) {
      return { success: false, error: 'Git not initialized' }
    }

    try {
      const logResult = await this.git.log([

      ])

      const commits = logResult.all.map(commit => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        refs: commit.refs,
        body: commit.body,
        author_name: commit.author_name,
        author_email: commit.author_email
      }))
      console.log('Commits:', logResult)
      return {
        success: true,
        data: { commits }
      }
    } catch (error) {
      console.error('Git log error:', error)
      return { 
        success: false, 
        error: 'Failed to get commit history' 
      }
    }
  }
}

const gitService = new GitService()

export default gitService