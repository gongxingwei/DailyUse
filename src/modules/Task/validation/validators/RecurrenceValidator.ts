// 重复规则验证器
import type { ITaskTemplate } from "@/modules/Task/domain/types/task";
import type { RecurrenceRule } from "@/modules/Task/domain/types/task";
import type { ITemplateValidator, ValidationResult } from "../types";
import { ValidationUtils } from "../ValidationUtils";

/**
 * 重复规则验证器
 * 负责验证任务模板的重复规则配置
 */
export class RecurrenceValidator implements ITemplateValidator {
  validate(template: ITaskTemplate): ValidationResult {
    const recurrence = template.timeConfig?.recurrence;

    if (!recurrence) {
      return ValidationUtils.failure(["重复规则不能为空"]);
    }

    if (recurrence.type === "none") {
      return ValidationUtils.success(["任务不重复，无需验证重复规则"]);
    }

    const results: ValidationResult[] = [];

    // 验证重复类型
    results.push(this.validateRecurrenceType(recurrence.type));

    // 验证重复间隔
    results.push(this.validateInterval(recurrence.interval, recurrence.type));

    // 验证结束条件
    results.push(
      this.validateEndCondition(recurrence.endCondition, recurrence.type)
    );

    // 验证重复配置
    if (recurrence.config) {
      results.push(
        this.validateRecurrenceConfig(recurrence.config, recurrence.type)
      );
    }

    // 验证业务逻辑
    results.push(this.validateBusinessLogic(recurrence, template));

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证重复类型
   */
  private validateRecurrenceType(type: string): ValidationResult {
    return ValidationUtils.validateEnum(
      type as any,
      "重复类型",
      ["none", "daily", "weekly", "monthly", "yearly", "custom"],
      true
    );
  }

  /**
   * 验证重复间隔
   */
  private validateInterval(
    interval: number | undefined,
    type: string
  ): ValidationResult {
    if (type === "none") {
      return ValidationUtils.success();
    }

    if (interval === undefined) {
      return ValidationUtils.success(["未设置重复间隔，将使用默认值1"]);
    }

    // 基本数值验证
    const numberResult = ValidationUtils.validateNumberRange(
      interval,
      "重复间隔",
      {
        min: 1,
        max: 365, // 最多365天/周/月/年
        required: false,
        integer: true,
      }
    );

    if (!numberResult.isValid) {
      return numberResult;
    }

    const warnings: string[] = [];

    // 根据类型给出建议
    switch (type) {
      case "daily":
        if (interval! > 30) {
          warnings.push("每日重复间隔超过30天，建议使用月重复");
        }
        break;
      case "weekly":
        if (interval! > 52) {
          warnings.push("每周重复间隔超过52周，建议使用年重复");
        }
        break;
      case "monthly":
        if (interval! > 24) {
          warnings.push("每月重复间隔超过24个月，建议使用年重复");
        }
        break;
      case "yearly":
        if (interval! > 10) {
          warnings.push("每年重复间隔超过10年，请确认是否正确");
        }
        break;
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证结束条件
   */
  private validateEndCondition(
    endCondition: any,
    recurrenceType: string
  ): ValidationResult {
    if (!endCondition) {
      return ValidationUtils.failure(["结束条件不能为空"]);
    }

    const results: ValidationResult[] = [];

    // 验证结束类型
    results.push(
      ValidationUtils.validateEnum(
        endCondition.type,
        "结束条件类型",
        ["never", "date", "count"],
        true
      )
    );

    // 验证具体的结束条件
    switch (endCondition.type) {
      case "date":
        results.push(this.validateEndDate(endCondition.endDate));
        break;
      case "count":
        results.push(this.validateEndCount(endCondition.count, recurrenceType));
        break;
      case "never":
        // 永不结束的任务给出警告
        if (recurrenceType !== "none") {
          results.push(
            ValidationUtils.success(["任务设置为永不结束，请确认这是预期行为"])
          );
        }
        break;
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证结束日期
   */
  private validateEndDate(endDate: any): ValidationResult {
    if (!endDate) {
      return ValidationUtils.failure(["结束日期不能为空"]);
    }

    // 使用时间配置验证器的日期验证逻辑
    const dateResult = ValidationUtils.validateDate(endDate, "结束日期", {
      required: true,
      futureOnly: true,
    });

    if (!dateResult.isValid) {
      return dateResult;
    }

    const warnings: string[] = [];

    // 检查结束日期是否过于久远
    const endTime = new Date(endDate.timestamp);
    const now = new Date();
    const fiveYearsLater = new Date(
      now.getFullYear() + 5,
      now.getMonth(),
      now.getDate()
    );

    if (endTime > fiveYearsLater) {
      warnings.push("结束日期设置在5年后，请确认是否正确");
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证结束次数
   */
  private validateEndCount(
    count: number | undefined,
    recurrenceType: string
  ): ValidationResult {
    if (count === undefined) {
      return ValidationUtils.failure(["结束次数不能为空"]);
    }

    const numberResult = ValidationUtils.validateNumberRange(
      count,
      "结束次数",
      {
        min: 1,
        max: 10000,
        required: true,
        integer: true,
      }
    );

    if (!numberResult.isValid) {
      return numberResult;
    }

    const warnings: string[] = [];

    // 根据重复类型给出建议
    switch (recurrenceType) {
      case "daily":
        if (count > 365) {
          warnings.push("每日重复超过365次，建议改用结束日期");
        }
        break;
      case "weekly":
        if (count > 52) {
          warnings.push("每周重复超过52次，建议改用结束日期");
        }
        break;
      case "monthly":
        if (count > 60) {
          warnings.push("每月重复超过60次，建议改用结束日期");
        }
        break;
      case "yearly":
        if (count > 20) {
          warnings.push("每年重复超过20次，请确认是否正确");
        }
        break;
    }

    return ValidationUtils.success(warnings);
  }

  /**
   * 验证重复配置
   */
  private validateRecurrenceConfig(
    config: any,
    type: string
  ): ValidationResult {
    const results: ValidationResult[] = [];

    switch (type) {
      case "weekly":
        if (config.weekdays) {
          results.push(this.validateWeekdays(config.weekdays));
        }
        break;
      case "monthly":
        if (config.monthDays) {
          results.push(this.validateMonthDays(config.monthDays));
        }
        if (config.monthWeekdays) {
          results.push(this.validateMonthWeekdays(config.monthWeekdays));
        }
        break;
      case "yearly":
        if (config.months) {
          results.push(this.validateMonths(config.months));
        }
        break;
    }

    return ValidationUtils.mergeResults(...results);
  }

  /**
   * 验证星期配置
   */
  private validateWeekdays(weekdays: number[]): ValidationResult {
    const arrayResult = ValidationUtils.validateArray(weekdays, "星期配置", {
      required: true,
      minLength: 1,
      maxLength: 7,
    });

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    const errors: string[] = [];
    const uniqueWeekdays = new Set(weekdays);

    if (uniqueWeekdays.size !== weekdays.length) {
      errors.push("星期配置中有重复值");
    }

    for (const day of weekdays) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        errors.push("星期值必须在0-6之间（0=周日，6=周六）");
        break;
      }
    }

    return errors.length > 0
      ? ValidationUtils.failure(errors)
      : ValidationUtils.success();
  }

  /**
   * 验证月份日期配置
   */
  private validateMonthDays(monthDays: number[]): ValidationResult {
    const arrayResult = ValidationUtils.validateArray(
      monthDays,
      "月份日期配置",
      {
        required: true,
        minLength: 1,
        maxLength: 31,
      }
    );

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    const errors: string[] = [];
    const uniqueDays = new Set(monthDays);

    if (uniqueDays.size !== monthDays.length) {
      errors.push("月份日期配置中有重复值");
    }

    for (const day of monthDays) {
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        errors.push("月份日期值必须在1-31之间");
        break;
      }
    }

    const warnings: string[] = [];
    if (monthDays.some((day) => day > 28)) {
      warnings.push("设置了29-31号，在某些月份可能不存在");
    }

    return errors.length > 0
      ? ValidationUtils.failure(errors, warnings)
      : ValidationUtils.success(warnings);
  }

  /**
   * 验证月份星期配置
   */
  private validateMonthWeekdays(monthWeekdays: any[]): ValidationResult {
    const arrayResult = ValidationUtils.validateArray(
      monthWeekdays,
      "月份星期配置",
      {
        required: true,
        minLength: 1,
        maxLength: 10,
      }
    );

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    const errors: string[] = [];

    for (const item of monthWeekdays) {
      if (
        !item.week ||
        !Number.isInteger(item.week) ||
        item.week < -1 ||
        item.week === 0 ||
        item.week > 5
      ) {
        errors.push("周数必须在1-5之间，或-1表示最后一周");
      }

      if (
        !Number.isInteger(item.weekday) ||
        item.weekday < 0 ||
        item.weekday > 6
      ) {
        errors.push("星期值必须在0-6之间");
      }
    }

    return errors.length > 0
      ? ValidationUtils.failure(errors)
      : ValidationUtils.success();
  }

  /**
   * 验证月份配置
   */
  private validateMonths(months: number[]): ValidationResult {
    const arrayResult = ValidationUtils.validateArray(months, "月份配置", {
      required: true,
      minLength: 1,
      maxLength: 12,
    });

    if (!arrayResult.isValid) {
      return arrayResult;
    }

    const errors: string[] = [];
    const uniqueMonths = new Set(months);

    if (uniqueMonths.size !== months.length) {
      errors.push("月份配置中有重复值");
    }

    for (const month of months) {
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        errors.push("月份值必须在1-12之间");
        break;
      }
    }

    return errors.length > 0
      ? ValidationUtils.failure(errors)
      : ValidationUtils.success();
  }

  /**
   * 验证业务逻辑
   */
  private validateBusinessLogic(
    recurrence: RecurrenceRule,
    template: ITaskTemplate
  ): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 检查单次任务是否设置了重复
    if (recurrence.type !== "none" && template.timeConfig.type === "allDay") {
      // 全天重复任务的特殊提示
      warnings.push("全天重复任务将在每个重复日的整天执行");
    }

    // 检查短时间重复任务
    if (recurrence.type === "daily" && recurrence.interval === 1) {
      if (template.timeConfig.type === "timeRange") {
        const duration =
          template.timeConfig.baseTime.end?.timestamp! -
          template.timeConfig.baseTime.start.timestamp;
        const durationHours = duration / (1000 * 60 * 60);

        if (durationHours > 12) {
          warnings.push("每日任务持续时间超过12小时，请确认是否合理");
        }
      }
    }

    // 检查习惯养成类任务
    if (
      recurrence.type === "daily" &&
      recurrence.endCondition?.type === "count"
    ) {
      const count = recurrence.endCondition.count!;
      if (count === 21 || count === 30 || count === 66) {
        warnings.push(`${count}天习惯养成计划，建议坚持执行`);
      }
    }

    if (errors.length > 0) {
      return ValidationUtils.failure(errors, warnings);
    }

    return ValidationUtils.success(warnings);
  }
}
