/**
 * Setting Value Controller
 * 设置值控制器
 */

import type { Request, Response } from 'express';
import { SettingValueApplicationService } from '../../../application/services/SettingValueApplicationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingValueController {
  private static settingService = new SettingValueApplicationService(prisma);

  /**
   * 获取设置值
   */
  static async getValue(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const setting = await SettingValueController.settingService.getByKey(accountUuid, key);

      if (!setting) {
        return res.status(404).json({
          success: false,
          error: '设置不存在',
        });
      }

      res.json({
        success: true,
        data: { key, value: setting.value },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取设置失败',
      });
    }
  }

  /**
   * 设置值 (创建或更新)
   */
  static async setValue(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const { value, scope } = req.body;

      // 检查是否存在，存在则更新，不存在则创建
      const existing = await SettingValueController.settingService.getByKey(accountUuid, key);

      if (existing) {
        await SettingValueController.settingService.update(accountUuid, key, value, scope);
      } else {
        await SettingValueController.settingService.create(
          accountUuid,
          key,
          value,
          scope || 'user',
        );
      }

      res.json({
        success: true,
        message: '设置更新成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '设置更新失败',
      });
    }
  }

  /**
   * 删除设置
   */
  static async deleteSetting(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      await SettingValueController.settingService.deleteByKey(accountUuid, key);

      res.json({
        success: true,
        message: '设置删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '设置删除失败',
      });
    }
  }

  /**
   * 获取所有设置
   */
  static async getAllSettings(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { scope } = req.query;

      let settings;
      if (scope) {
        settings = await SettingValueController.settingService.getByScope(
          accountUuid,
          scope as any,
        );
      } else {
        settings = await SettingValueController.settingService.getAllByAccount(accountUuid);
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取设置列表失败',
      });
    }
  }

  /**
   * 批量更新设置
   */
  static async batchUpdate(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { settings } = req.body;

      await SettingValueController.settingService.batchSet(accountUuid, settings);

      res.json({
        success: true,
        message: '批量更新设置成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量更新设置失败',
      });
    }
  }

  /**
   * 导出设置
   */
  static async exportSettings(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { scope } = req.query;

      const exported = await SettingValueController.settingService.exportSettings(
        accountUuid,
        scope as any,
      );

      res.json({
        success: true,
        data: exported,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '导出设置失败',
      });
    }
  }

  /**
   * 导入设置
   */
  static async importSettings(req: Request, res: Response) {
    try {
      const { accountUuid } = req.params;
      const { settings } = req.body;

      await SettingValueController.settingService.importSettings(accountUuid, settings);

      res.json({
        success: true,
        message: '导入设置成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '导入设置失败',
      });
    }
  }

  /**
   * 获取字符串设置
   */
  static async getStringValue(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const { defaultValue } = req.query;

      const value = await SettingValueController.settingService.getString(
        accountUuid,
        key,
        defaultValue as string,
      );

      res.json({
        success: true,
        data: { key, value },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取字符串设置失败',
      });
    }
  }

  /**
   * 获取数字设置
   */
  static async getNumberValue(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const { defaultValue } = req.query;

      const value = await SettingValueController.settingService.getNumber(
        accountUuid,
        key,
        defaultValue ? parseFloat(defaultValue as string) : undefined,
      );

      res.json({
        success: true,
        data: { key, value },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取数字设置失败',
      });
    }
  }

  /**
   * 获取布尔设置
   */
  static async getBooleanValue(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const { defaultValue } = req.query;

      const value = await SettingValueController.settingService.getBoolean(
        accountUuid,
        key,
        defaultValue ? defaultValue === 'true' : undefined,
      );

      res.json({
        success: true,
        data: { key, value },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取布尔设置失败',
      });
    }
  }

  /**
   * 切换布尔设置
   */
  static async toggleBoolean(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;

      const newValue = await SettingValueController.settingService.toggle(accountUuid, key);

      res.json({
        success: true,
        data: { key, value: newValue },
        message: '设置切换成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '设置切换失败',
      });
    }
  }

  /**
   * 增加数字设置
   */
  static async incrementNumber(req: Request, res: Response) {
    try {
      const { accountUuid, key } = req.params;
      const { delta } = req.body;

      const newValue = await SettingValueController.settingService.increment(
        accountUuid,
        key,
        delta || 1,
      );

      res.json({
        success: true,
        data: { key, value: newValue },
        message: '设置递增成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '设置递增失败',
      });
    }
  }
}
