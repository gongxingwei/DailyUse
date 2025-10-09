/**
 * GitInfo 值对象测试
 */

import { describe, it, expect } from 'vitest';
import { GitInfo } from './GitInfo';

describe('GitInfo Value Object', () => {
  describe('工厂方法', () => {
    it('应该创建非 Git 仓库状态', () => {
      const gitInfo = GitInfo.createNonGit();

      expect(gitInfo.isGitRepo).toBe(false);
      expect(gitInfo.currentBranch).toBeNull();
      expect(gitInfo.hasChanges).toBeNull();
      expect(gitInfo.remoteUrl).toBeNull();
    });

    it('应该创建已初始化的 Git 仓库状态（默认参数）', () => {
      const gitInfo = GitInfo.createInitializedGit({});

      expect(gitInfo.isGitRepo).toBe(true);
      expect(gitInfo.currentBranch).toBe('main');
      expect(gitInfo.hasChanges).toBe(false);
      expect(gitInfo.remoteUrl).toBeNull();
    });

    it('应该创建已初始化的 Git 仓库状态（自定义参数）', () => {
      const gitInfo = GitInfo.createInitializedGit({
        currentBranch: 'develop',
        remoteUrl: 'https://github.com/user/repo.git',
      });

      expect(gitInfo.isGitRepo).toBe(true);
      expect(gitInfo.currentBranch).toBe('develop');
      expect(gitInfo.hasChanges).toBe(false);
      expect(gitInfo.remoteUrl).toBe('https://github.com/user/repo.git');
    });
  });

  describe('不可变性', () => {
    it('应该是冻结的（不可变）', () => {
      const gitInfo = GitInfo.createNonGit();

      expect(Object.isFrozen(gitInfo)).toBe(true);
    });

    it('不应该允许修改属性', () => {
      const gitInfo = GitInfo.createNonGit();

      expect(() => {
        (gitInfo as any).isGitRepo = true;
      }).toThrow();
    });
  });

  describe('with() 方法 - 创建修改后的副本', () => {
    it('应该创建新实例而不修改原实例', () => {
      const original = GitInfo.createNonGit();
      const modified = original.with({ isGitRepo: true, currentBranch: 'main' });

      expect(original.isGitRepo).toBe(false);
      expect(modified.isGitRepo).toBe(true);
      expect(modified.currentBranch).toBe('main');
      expect(original).not.toBe(modified);
    });

    it('应该只修改指定的字段', () => {
      const original = GitInfo.createInitializedGit({});
      const modified = original.with({
        hasChanges: true,
        remoteUrl: 'https://github.com/test/repo.git',
      });

      expect(modified.hasChanges).toBe(true);
      expect(modified.remoteUrl).toBe('https://github.com/test/repo.git');
      expect(modified.isGitRepo).toBe(original.isGitRepo);
      expect(modified.currentBranch).toBe(original.currentBranch);
    });

    it('应该支持链式修改', () => {
      const gitInfo = GitInfo.createNonGit()
        .with({ isGitRepo: true })
        .with({ currentBranch: 'main' })
        .with({ hasChanges: false });

      expect(gitInfo.isGitRepo).toBe(true);
      expect(gitInfo.currentBranch).toBe('main');
      expect(gitInfo.hasChanges).toBe(false);
    });
  });

  describe('equals() 方法', () => {
    it('相同内容的 GitInfo 应该相等', () => {
      const gitInfo1 = new GitInfo({
        isGitRepo: true,
        currentBranch: 'main',
        hasChanges: false,
        remoteUrl: 'https://github.com/user/repo.git',
      });

      const gitInfo2 = new GitInfo({
        isGitRepo: true,
        currentBranch: 'main',
        hasChanges: false,
        remoteUrl: 'https://github.com/user/repo.git',
      });

      expect(gitInfo1.equals(gitInfo2)).toBe(true);
      expect(gitInfo2.equals(gitInfo1)).toBe(true);
    });

    it('不同内容的 GitInfo 应该不相等', () => {
      const gitInfo1 = GitInfo.createNonGit();
      const gitInfo2 = GitInfo.createInitializedGit({});

      expect(gitInfo1.equals(gitInfo2)).toBe(false);
      expect(gitInfo2.equals(gitInfo1)).toBe(false);
    });

    it('与非 GitInfo 对象比较应该返回 false', () => {
      const gitInfo = GitInfo.createNonGit();
      const other = { isGitRepo: false } as any;

      expect(gitInfo.equals(other)).toBe(false);
    });
  });

  describe('业务查询方法', () => {
    describe('hasUncommittedChanges()', () => {
      it('当是 Git 仓库且有变更时应该返回 true', () => {
        const gitInfo = GitInfo.createInitializedGit({}).with({ hasChanges: true });
        expect(gitInfo.hasUncommittedChanges()).toBe(true);
      });

      it('当是 Git 仓库但没有变更时应该返回 false', () => {
        const gitInfo = GitInfo.createInitializedGit({});
        expect(gitInfo.hasUncommittedChanges()).toBe(false);
      });

      it('当不是 Git 仓库时应该返回 false', () => {
        const gitInfo = GitInfo.createNonGit();
        expect(gitInfo.hasUncommittedChanges()).toBe(false);
      });

      it('当变更状态未知时应该返回 false', () => {
        const gitInfo = new GitInfo({
          isGitRepo: true,
          currentBranch: 'main',
          hasChanges: null,
          remoteUrl: null,
        });
        expect(gitInfo.hasUncommittedChanges()).toBe(false);
      });
    });

    describe('hasRemote()', () => {
      it('当配置了远程仓库时应该返回 true', () => {
        const gitInfo = GitInfo.createInitializedGit({
          remoteUrl: 'https://github.com/user/repo.git',
        });
        expect(gitInfo.hasRemote()).toBe(true);
      });

      it('当没有配置远程仓库时应该返回 false', () => {
        const gitInfo = GitInfo.createInitializedGit({});
        expect(gitInfo.hasRemote()).toBe(false);
      });

      it('当不是 Git 仓库时应该返回 false', () => {
        const gitInfo = GitInfo.createNonGit();
        expect(gitInfo.hasRemote()).toBe(false);
      });

      it('当远程 URL 是空字符串时应该返回 false', () => {
        const gitInfo = GitInfo.createInitializedGit({
          remoteUrl: '',
        });
        expect(gitInfo.hasRemote()).toBe(false);
      });
    });

    describe('canPush()', () => {
      it('当满足所有条件时应该返回 true', () => {
        const gitInfo = GitInfo.createInitializedGit({
          remoteUrl: 'https://github.com/user/repo.git',
        });
        expect(gitInfo.canPush()).toBe(true);
      });

      it('当没有配置远程仓库时应该返回 false', () => {
        const gitInfo = GitInfo.createInitializedGit({});
        expect(gitInfo.canPush()).toBe(false);
      });

      it('当有未提交的变更时应该返回 false', () => {
        const gitInfo = GitInfo.createInitializedGit({
          remoteUrl: 'https://github.com/user/repo.git',
        }).with({ hasChanges: true });
        expect(gitInfo.canPush()).toBe(false);
      });

      it('当不是 Git 仓库时应该返回 false', () => {
        const gitInfo = GitInfo.createNonGit();
        expect(gitInfo.canPush()).toBe(false);
      });
    });

    describe('getStatusDescription()', () => {
      it('当不是 Git 仓库时应该返回正确描述', () => {
        const gitInfo = GitInfo.createNonGit();
        expect(gitInfo.getStatusDescription()).toBe('Not a Git repository');
      });

      it('当有未提交变更时应该返回正确描述', () => {
        const gitInfo = GitInfo.createInitializedGit({}).with({ hasChanges: true });
        expect(gitInfo.getStatusDescription()).toBe('Has uncommitted changes');
      });

      it('当工作目录干净时应该返回正确描述', () => {
        const gitInfo = GitInfo.createInitializedGit({});
        expect(gitInfo.getStatusDescription()).toBe('Clean working directory');
      });

      it('当状态未知时应该返回正确描述', () => {
        const gitInfo = new GitInfo({
          isGitRepo: true,
          currentBranch: 'main',
          hasChanges: null,
          remoteUrl: null,
        });
        expect(gitInfo.getStatusDescription()).toBe('Unknown status');
      });
    });
  });

  describe('toContract() 和 fromContract()', () => {
    it('应该正确转换为 DTO', () => {
      const gitInfo = new GitInfo({
        isGitRepo: true,
        currentBranch: 'develop',
        hasChanges: true,
        remoteUrl: 'https://github.com/user/repo.git',
      });

      const dto = gitInfo.toContract();

      expect(dto.isGitRepo).toBe(true);
      expect(dto.currentBranch).toBe('develop');
      expect(dto.hasChanges).toBe(true);
      expect(dto.remoteUrl).toBe('https://github.com/user/repo.git');
    });

    it('应该从 DTO 正确创建对象', () => {
      const dto = {
        isGitRepo: false,
        currentBranch: null,
        hasChanges: null,
        remoteUrl: null,
      };

      const gitInfo = GitInfo.fromContract(dto);

      expect(gitInfo.isGitRepo).toBe(false);
      expect(gitInfo.currentBranch).toBeNull();
      expect(gitInfo.hasChanges).toBeNull();
      expect(gitInfo.remoteUrl).toBeNull();
    });

    it('应该支持往返转换（roundtrip）', () => {
      const original = new GitInfo({
        isGitRepo: true,
        currentBranch: 'main',
        hasChanges: false,
        remoteUrl: 'https://github.com/user/repo.git',
      });

      const dto = original.toContract();
      const restored = GitInfo.fromContract(dto);

      expect(original.equals(restored)).toBe(true);
    });
  });

  describe('实际使用场景', () => {
    it('应该正确模拟 Git 仓库初始化流程', () => {
      // 1. 开始时不是 Git 仓库
      let gitInfo = GitInfo.createNonGit();
      expect(gitInfo.isGitRepo).toBe(false);
      expect(gitInfo.canPush()).toBe(false);

      // 2. 初始化 Git 仓库
      gitInfo = GitInfo.createInitializedGit({});
      expect(gitInfo.isGitRepo).toBe(true);
      expect(gitInfo.currentBranch).toBe('main');
      expect(gitInfo.hasRemote()).toBe(false);

      // 3. 添加远程仓库
      gitInfo = gitInfo.with({ remoteUrl: 'https://github.com/user/repo.git' });
      expect(gitInfo.hasRemote()).toBe(true);
      expect(gitInfo.canPush()).toBe(true);
    });

    it('应该正确模拟提交流程', () => {
      // 1. 干净的 Git 仓库
      let gitInfo = GitInfo.createInitializedGit({
        remoteUrl: 'https://github.com/user/repo.git',
      });
      expect(gitInfo.hasUncommittedChanges()).toBe(false);
      expect(gitInfo.canPush()).toBe(true);

      // 2. 修改文件后有未提交变更
      gitInfo = gitInfo.with({ hasChanges: true });
      expect(gitInfo.hasUncommittedChanges()).toBe(true);
      expect(gitInfo.canPush()).toBe(false);
      expect(gitInfo.getStatusDescription()).toBe('Has uncommitted changes');

      // 3. 提交后工作目录干净
      gitInfo = gitInfo.with({ hasChanges: false });
      expect(gitInfo.hasUncommittedChanges()).toBe(false);
      expect(gitInfo.canPush()).toBe(true);
      expect(gitInfo.getStatusDescription()).toBe('Clean working directory');
    });
  });
});
