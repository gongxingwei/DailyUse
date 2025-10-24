// 元数据验证器
import type { ITaskTemplate } from '@common/modules/task/types/task';
import type { ITemplateValidator, ValidationResult } from './types';
import { ValidationUtils } from './ValidationUtils';
import { ImportanceLevel } from '@dailyuse/contracts';
import { UrgencyLevel } from '@dailyuse/contracts';
/**
 * 元数据验证器
 * 负责验证任务模板的元数据信息
 */
export class MetadataValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const metadata = template.metadata;

    if (!metadata) {
      return ValidationUtils.failure(['元数据不能为空']);
    }

    const results: ValidationResult[] = [];

    // 验证各个元数据字段
    results.push(this.validateCategory(metadata.category));
    results.push(this.validateTags(metadata.tags));
    results.push(this.validateEstimatedDuration(metadata.estimatedDuration));
    results.push(this.validateImportance(metadata.importance));
    results.push(this.validateUrgency(metadata.urgency));
    results.push(this.validateLocation(metadata.location));

    // 验证元数据组合的合理性
    results.push(this.validateMetadataCombination(metadata, template));

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证分类
   */
  private validateCategory(category: any): ValidationResult {
    const requiredResult = ValidationUtils.validateRequired(category, '分类');
    if (!requiredResult.isValid) {
      return requiredResult;
    }

    const lengthResult = ValidationUtils.validateStringLength(category, '分类', {
      min: 1,
      max: 50,
      required: true,
    });

    if (!lengthResult.isValid) {
      return lengthResult;
    }

    // 推荐的分类列表
    const recommendedCategories = [
      'work',
      'personal',
      'health',
      'learning',
      'family',
      'finance',
      'hobby',
      'travel',
      'habit',
      'project',
      'meeting',
      'exercise',
      'reading',
      'shopping',
      'maintenance',
    ];

    const warnings: string[] = [];
    if (!recommendedCategories.includes(category.toLowerCase())) {
      warnings.push(`建议使用推荐分类: ${recommendedCategories.slice(0, 5).join(', ')} 等`);
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证标签
   */
  private validateTags(tags: any): ValidationResult {
    if (!Array.isArray(tags)) {
      return ValidationUtils.failure(['标签必须是数组']);
    }

    const arrayResult = ValidationUtils.validateArray(tags, '标签', {
      maxLength: 20, // 最多20个标签
      elementValidator: (tag, index) => this.validateTag(tag, index),
    });

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    // 检查重复标签
    const uniqueTags = new Set(tags.map((tag) => tag.toLowerCase()));
    if (uniqueTags.size !== tags.length) {
      return ValidationUtils.failure(['标签中存在重复项']);
    }

    const warnings: string[] = [];

    if (tags.length === 0) {
      warnings.push('建议添加一些标签以便更好地组织任务');
    } else if (tags.length > 10) {
      warnings.push('标签过多可能影响任务管理效率');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证单个标签
   */
  private validateTag(tag: any, index: number): ValidationResult {
    const tagName = `标签[${index}]`;

    if (typeof tag !== 'string') {
      return ValidationUtils.failure([`${tagName}必须是字符串`]);
    }

    const lengthResult = ValidationUtils.validateStringLength(tag, tagName, {
      min: 1,
      max: 20,
      required: true,
    });

    if (!lengthResult.isValid) {
      return lengthResult;
    }

    // 检查标签格式
    const trimmed = tag.trim();
    if (trimmed !== tag) {
      return ValidationUtils.failure([`${tagName}不能包含前后空格`]);
    }

    // 检查特殊字符
    const invalidChars = /[<>\"'&,;]/g;
    if (invalidChars.test(tag)) {
      return ValidationUtils.failure([`${tagName}不能包含特殊字符: < > " ' & , ;`]);
    }

    return ValidationUtils.success();
  }

  /**
   * 验证预估时长
   */
  private validateEstimatedDuration(duration: any): ValidationResult {
    if (duration === undefined) {
      return ValidationUtils.success(['建议设置预估时长以便更好地安排时间']);
    }

    const numberResult = ValidationUtils.validateNumberRange(duration, '预估时长', {
      min: 1,
      max: 8 * 60, // 最长8小时
      required: false,
      integer: true,
    });

    if (!numberResult.isValid) {
      return numberResult;
    }

    const warnings: string[] = [];

    // 给出时长建议
    if (duration < 5) {
      warnings.push('任务时长很短，考虑与其他小任务合并');
    } else if (duration > 4 * 60) {
      // 超过4小时
      warnings.push('任务时长较长，建议分解为多个子任务');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证优先级
   */
  private validateImportance(importance: ImportanceLevel): ValidationResult {
    if (importance === undefined) {
      return ValidationUtils.success(['未设置重要性，将使用默认重要性']);
    }
    return ValidationUtils.validateEnum(
      importance,
      '任务重要性',
      [
        ImportanceLevel.Vital,
        ImportanceLevel.Important,
        ImportanceLevel.Moderate,
        ImportanceLevel.Minor,
        ImportanceLevel.Trivial,
      ],
      false,
    );
  }

  /**
   * 验证紧急等级
   */
  private validateUrgency(urgency: UrgencyLevel): ValidationResult {
    if (urgency === undefined) {
      return ValidationUtils.success(['未设置紧急性，将使用默认紧急性']);
    }
    const enumResult = ValidationUtils.validateEnum(
      urgency,
      '任务紧急性',
      [
        UrgencyLevel.Critical,
        UrgencyLevel.High,
        UrgencyLevel.Medium,
        UrgencyLevel.Low,
        UrgencyLevel.None,
      ],
      false,
    );
    if (!enumResult.isValid) {
      return enumResult;
    }
    const warnings: string[] = [];
    switch (urgency) {
      case UrgencyLevel.Critical:
        warnings.push('极高紧急性任务，请优先处理');
        break;
      case UrgencyLevel.None:
        warnings.push('无紧急性任务，可灵活安排');
        break;
    }
    return ValidationUtils.success(warnings);
  }

  /**
   * 验证地点
   */
  private validateLocation(location: any): ValidationResult {
    if (!location) {
      return ValidationUtils.success();
    }

    const lengthResult = ValidationUtils.validateStringLength(location, '地点', {
      max: 100,
    });

    if (!lengthResult.isValid) {
      return lengthResult;
    }

    const warnings: string[] = [];

    // 检查是否包含有用信息
    if (location.trim().length < 3) {
      warnings.push('地点信息过于简短，建议提供更具体的位置');
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证元数据组合的合理性
   */
  private validateMetadataCombination(metadata: any, template: ITaskTemplate): ValidationResult {
    const warnings: string[] = [];

    // 根据任务类型给出元数据建议
    if (template.timeConfig.type === 'allDay') {
      if (metadata.estimatedDuration && metadata.estimatedDuration < 30) {
        warnings.push('全天任务的预估时长通常应该较长');
      }
    }

    // 根据重复类型给出建议
    if (template.timeConfig.recurrence.type === 'daily') {
      if (metadata.difficulty >= 4) {
        warnings.push('每日重复的高难度任务可能难以坚持');
      }

      if (metadata.estimatedDuration && metadata.estimatedDuration > 2 * 60) {
        warnings.push('每日重复任务时长过长可能影响持续性');
      }
    } // 分类与标签的一致性检查
    const categoryLower = metadata.category.toLowerCase();
    const tagLower = metadata.tags.map((tag: string) => tag.toLowerCase());

    if (
      categoryLower === 'work' &&
      !tagLower.some((tag: string) =>
        ['工作', 'work', '项目', 'project', '会议', 'meeting'].includes(tag),
      )
    ) {
      warnings.push('工作类任务建议添加相关标签');
    }

    if (
      categoryLower === 'health' &&
      !tagLower.some((tag: string) => ['健康', 'health', '运动', 'exercise', '锻炼'].includes(tag))
    ) {
      warnings.push('健康类任务建议添加相关标签');
    }

    // 难度与时长的匹配性
    if (
      metadata.difficulty <= 2 &&
      metadata.estimatedDuration &&
      metadata.estimatedDuration > 3 * 60
    ) {
      warnings.push('简单任务的时长设置较长，请确认难度评估是否准确');
    }

    if (metadata.difficulty >= 4 && metadata.estimatedDuration && metadata.estimatedDuration < 30) {
      warnings.push('高难度任务的时长设置较短，请确认是否合理');
    }

    // 地点与任务类型的匹配
    if (metadata.location) {
      const locationLower = metadata.location.toLowerCase();

      if (categoryLower === 'work' && locationLower.includes('家')) {
        warnings.push('工作任务设置在家中执行，请确认是否为远程工作');
      }

      if (
        template.timeConfig.type === 'allDay' &&
        (locationLower.includes('办公室') || locationLower.includes('公司'))
      ) {
        warnings.push('全天任务设置在特定工作场所，请确认时间安排');
      }
    }

    return ValidationUtils.success(warnings);
  }
}
