import { Router, type Router as ExpressRouter } from 'express';
import { UserPreferencesController } from '../controllers/UserPreferencesController';

/**
 * @swagger
 * tags:
 *   - name: Settings
 *     description: 用户设置管理接口
 */

const router: ExpressRouter = Router();

/**
 * @swagger
 * /settings/preferences:
 *   get:
 *     tags: [Settings]
 *     summary: 获取用户偏好设置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户偏好
 *       401:
 *         description: 未授权
 */
router.get('/', UserPreferencesController.getPreferences);

/**
 * @swagger
 * /settings/preferences:
 *   put:
 *     tags: [Settings]
 *     summary: 更新用户偏好设置
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功更新用户偏好
 */
router.put('/', UserPreferencesController.updatePreferences);

/**
 * @swagger
 * /settings/preferences/theme-mode:
 *   post:
 *     tags: [Settings]
 *     summary: 切换主题模式
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - themeMode
 *             properties:
 *               themeMode:
 *                 type: string
 *                 enum: [light, dark, system]
 *     responses:
 *       200:
 *         description: 成功切换主题模式
 */
router.post('/theme-mode', UserPreferencesController.switchThemeMode);

/**
 * @swagger
 * /settings/preferences/language:
 *   post:
 *     tags: [Settings]
 *     summary: 更改语言
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [zh-CN, en-US, ja-JP, ko-KR]
 *     responses:
 *       200:
 *         description: 成功更改语言
 */
router.post('/language', UserPreferencesController.changeLanguage);

/**
 * @swagger
 * /settings/preferences/notifications:
 *   post:
 *     tags: [Settings]
 *     summary: 更新通知偏好
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationsEnabled:
 *                 type: boolean
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 成功更新通知偏好
 */
router.post('/notifications', UserPreferencesController.updateNotificationPreferences);

/**
 * @swagger
 * /settings/preferences/reset:
 *   post:
 *     tags: [Settings]
 *     summary: 重置为默认设置
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功重置为默认设置
 */
router.post('/reset', UserPreferencesController.resetToDefault);

export default router;
