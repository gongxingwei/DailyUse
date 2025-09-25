import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccountService } from '../useAccountService';
import { useSnackbar } from '@/shared/composables/useSnackbar';
import { ApplicationService } from '../../../application/services/ApplicationService';
import { AccountType } from '@dailyuse/contracts';
import type { RegistrationByUsernameAndPasswordForm } from '@dailyuse/contracts';
// Pinia setup is handled globally in tests/setup.ts

// Mock dependencies
vi.mock('@/shared/composables/useSnackbar');
vi.mock('../../../application/services/ApplicationService');

describe('useAccountService', () => {
  let mockSnackbar: any;
  let mockApplicationService: any;

  beforeEach(() => {
    // Mock snackbar
    mockSnackbar = {
      snackbar: {
        show: false,
        message: '',
        color: 'info' as const,
        timeout: 5000,
      },
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    // Mock application service
    mockApplicationService = {
      register: vi.fn(),
    };

    // Setup mocks
    vi.mocked(useSnackbar).mockReturnValue(mockSnackbar);
    vi.mocked(ApplicationService.getInstance).mockResolvedValue(mockApplicationService);
  });

  describe('初始化', () => {
    it('应该正确初始化 composable', () => {
      const accountService = useAccountService();

      expect(accountService).toBeDefined();
      expect(typeof accountService.handleUpdateUserProfile).toBe('function');
      expect(typeof accountService.handleRegistration).toBe('function');
    });

    it('应该正确获取 snackbar 实例', () => {
      const accountService = useAccountService();

      expect(accountService.snackbar).toBeDefined();
      expect(accountService.snackbar.show).toBe(false);
    });
  });

  describe('用户信息更新', () => {
    it('应该能够更新用户信息', async () => {
      const accountService = useAccountService();

      // 目前只是一个占位符实现
      await accountService.handleUpdateUserProfile();

      // 验证函数可以正常调用
      expect(true).toBe(true);
    });
  });

  describe('用户注册', () => {
    it('应该能够处理成功注册', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      mockApplicationService.register.mockResolvedValue(true);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      expect(ApplicationService.getInstance).toHaveBeenCalled();
      expect(mockApplicationService.register).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agreement: {
          agreedToPrivacy: true,
          agreedToTerms: true,
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          agreedAt: expect.any(Number),
        },
        accountType: AccountType.GUEST,
      });
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('注册成功');
    });

    it('应该处理注册失败', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      mockApplicationService.register.mockResolvedValue(false);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      expect(mockApplicationService.register).toHaveBeenCalled();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('注册失败: ');
    });

    it('应该正确构造注册请求数据', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'newuser',
        password: 'newpass456',
        confirmPassword: 'newpass456',
        agree: false,
      };

      mockApplicationService.register.mockResolvedValue(true);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      expect(mockApplicationService.register).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'newpass456',
        confirmPassword: 'newpass456',
        agreement: {
          agreedToPrivacy: false,
          agreedToTerms: false,
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          agreedAt: expect.any(Number),
        },
        accountType: AccountType.GUEST,
      });
    });

    it('应该处理注册过程中的异常', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      const error = new Error('网络错误');
      mockApplicationService.register.mockRejectedValue(error);

      const accountService = useAccountService();

      // 验证异常会被抛出
      await expect(accountService.handleRegistration(registrationData)).rejects.toThrow('网络错误');

      expect(ApplicationService.getInstance).toHaveBeenCalled();
      expect(mockApplicationService.register).toHaveBeenCalled();
    });
  });

  describe('数据验证', () => {
    it('应该使用正确的账户类型', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      mockApplicationService.register.mockResolvedValue(true);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      const expectedCall = expect.objectContaining({
        accountType: AccountType.GUEST,
      });

      expect(mockApplicationService.register).toHaveBeenCalledWith(expectedCall);
    });

    it('应该设置正确的协议版本', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      mockApplicationService.register.mockResolvedValue(true);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      const expectedCall = expect.objectContaining({
        agreement: expect.objectContaining({
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
        }),
      });

      expect(mockApplicationService.register).toHaveBeenCalledWith(expectedCall);
    });

    it('应该设置当前时间戳', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      mockApplicationService.register.mockResolvedValue(true);

      const beforeTime = Date.now();
      const accountService = useAccountService();
      await accountService.handleRegistration(registrationData);
      const afterTime = Date.now();

      const registerCall = mockApplicationService.register.mock.calls[0][0];
      const agreedAt = registerCall.agreement.agreedAt;

      expect(agreedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(agreedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('边界情况', () => {
    it('应该处理空的注册数据', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: '',
        password: '',
        confirmPassword: '',
        agree: false,
      };

      mockApplicationService.register.mockResolvedValue(false);

      const accountService = useAccountService();

      await accountService.handleRegistration(registrationData);

      expect(mockApplicationService.register).toHaveBeenCalledWith({
        username: '',
        password: '',
        confirmPassword: '',
        agreement: {
          agreedToPrivacy: false,
          agreedToTerms: false,
          termsVersion: '1.0.0',
          privacyVersion: '1.0.0',
          agreedAt: expect.any(Number),
        },
        accountType: AccountType.GUEST,
      });

      expect(mockSnackbar.showError).toHaveBeenCalledWith('注册失败: ');
    });

    it('应该处理应用服务获取失败', async () => {
      const registrationData: RegistrationByUsernameAndPasswordForm = {
        username: 'testuser',
        password: 'testpass123',
        confirmPassword: 'testpass123',
        agree: true,
      };

      vi.mocked(ApplicationService.getInstance).mockRejectedValue(new Error('服务不可用'));

      const accountService = useAccountService();

      await expect(accountService.handleRegistration(registrationData)).rejects.toThrow(
        '服务不可用',
      );
    });
  });
});
