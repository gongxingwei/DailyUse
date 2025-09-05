import { Router } from 'express';
import { AuthenticationController } from './controller';
import { AuthenticationApplicationService } from '../../application/services/AuthenticationApplicationService';

const router = Router();

const authenticationService = await AuthenticationApplicationService.getInstance();

const authController = new AuthenticationController(authenticationService);

/**
 * Authentication Routes
 * 认证相关的API路由
 */

// 登录
router.post('/login', (req, res) => authController.login(req, res));

// MFA验证
router.post('/mfa/verify', (req, res) => authController.verifyMFA(req, res));

// 登出
router.post('/logout', (req, res) => authController.logout(req, res));

// 刷新令牌
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

// MFA设备管理
router.post('/mfa/devices', (req, res) => authController.createMFADevice(req, res));
router.get('/mfa/devices/:accountUuid', (req, res) => authController.getMFADevices(req, res));
router.delete('/mfa/devices/:deviceUuid', (req, res) => authController.deleteMFADevice(req, res));

// 会话管理
router.get('/sessions/:accountUuid', (req, res) => authController.getSessions(req, res));
router.delete('/sessions/:sessionId', (req, res) => authController.terminateSession(req, res));

export { router as authenticationRoutes };
