/**
 * Theme Routes
 * 主题路由
 *
 * @description 主题偏好管理路由
 */

import { Router } from 'express';
import { ThemeController } from '../controllers/ThemeController';

/**
 * Theme Routes - 主题路由
 *
 * 路由设计原则：
 * 1. 基于DDD聚合根控制模式
 * 2. UserThemePreference 作为独立聚合根
 * 3. 使用统一的响应格式
 *
 * @swagger
 * tags:
 *   - name: Theme
 *     description: 主题管理接口
 */

const router = Router();

// ============ 用户主题偏好管理 ============

/**
 * @swagger
 * /theme/preferences:
 *   get:
 *     tags: [Theme]
 *     summary: 获取用户主题偏好
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 主题偏好获取成功
 */
router.get('/preferences', ThemeController.getPreferences);

/**
 * @swagger
 * /theme/preferences/mode:
 *   post:
 *     tags: [Theme]
 *     summary: 切换主题模式
 *     description: 切换为 light/dark/system 模式
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [light, dark, system]
 *     responses:
 *       200:
 *         description: 主题模式切换成功
 */
router.post('/preferences/mode', ThemeController.switchMode);

/**
 * @swagger
 * /theme/preferences/apply:
 *   post:
 *     tags: [Theme]
 *     summary: 应用自定义主题
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - themeUuid
 *             properties:
 *               themeUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 主题应用成功
 */
router.post('/preferences/apply', ThemeController.applyTheme);

/**
 * @swagger
 * /theme/preferences/auto-switch:
 *   put:
 *     tags: [Theme]
 *     summary: 配置自动切换
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *               scheduleStart:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               scheduleEnd:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *     responses:
 *       200:
 *         description: 自动切换配置成功
 */
router.put('/preferences/auto-switch', ThemeController.configureAutoSwitch);

/**
 * @swagger
 * /theme/preferences/reset:
 *   post:
 *     tags: [Theme]
 *     summary: 重置为默认偏好
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 主题偏好重置成功
 */
router.post('/preferences/reset', ThemeController.resetToDefault);

export default router;
