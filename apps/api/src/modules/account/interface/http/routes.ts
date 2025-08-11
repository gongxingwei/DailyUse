import { Router } from 'express';
import { AccountController } from '../../application/AccountController';

// 如果认证中间件存在，取消注释下面的行
// import { authenticateToken } from '../auth/middlewares/auth.middleware';

const router = Router();

// 创建账户 - 通常不需要认证（注册）
router.post('/accounts', AccountController.createAccount);

// 以下路由需要认证（如果有认证中间件，取消注释）
// router.use(authenticateToken);

// 获取账户信息
router.get('/accounts/:id', AccountController.getAccountById);
router.get('/accounts/username/:username', AccountController.getAccountByUsername);

// 更新账户
router.put('/accounts/:id', AccountController.updateAccount);

// 账户状态管理
router.post('/accounts/:id/activate', AccountController.activateAccount);
router.post('/accounts/:id/deactivate', AccountController.deactivateAccount);
router.post('/accounts/:id/suspend', AccountController.suspendAccount);

// 验证功能
router.post('/accounts/:id/verify-email', AccountController.verifyEmail);
router.post('/accounts/:id/verify-phone', AccountController.verifyPhone);

// 账户列表和搜索（管理员功能）
router.get('/accounts', AccountController.getAllAccounts);
router.get('/accounts/search', AccountController.searchAccounts);

// 删除账户（管理员功能）
router.delete('/accounts/:id', AccountController.deleteAccount);

export default router;
