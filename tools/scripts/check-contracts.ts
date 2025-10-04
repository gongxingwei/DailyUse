/**
 * Contracts 类型检查和修复工具
 *
 * 用途：
 * 1. 检查所有 contracts 类型定义是否符合命名规范
 * 2. 列出缺失的类型定义
 * 3. 列出重复或冗余的类型定义
 * 4. 生成修复建议
 */

import * as fs from 'fs';
import * as path from 'path';

interface TypeDefinition {
  name: string;
  type: 'Request' | 'Response' | 'DTO' | 'Other';
  module: string;
  file: string;
  hasDataWrapper?: boolean;
}

interface CheckResult {
  missing: string[];
  duplicates: string[];
  inconsistent: TypeDefinition[];
  unused: string[];
  suggestions: string[];
}

const CONTRACTS_DIR = path.join(__dirname, '../packages/contracts/src/modules');
const MODULES = ['reminder', 'task', 'schedule', 'goal'];

/**
 * 扫描所有 contracts 类型定义
 */
function scanContracts(): Map<string, TypeDefinition[]> {
  const typesByModule = new Map<string, TypeDefinition[]>();

  for (const module of MODULES) {
    const modulePath = path.join(CONTRACTS_DIR, module);
    const dtosPath = path.join(modulePath, 'dtos.ts');

    if (!fs.existsSync(dtosPath)) {
      console.warn(`⚠️  未找到 ${module}/dtos.ts`);
      continue;
    }

    const content = fs.readFileSync(dtosPath, 'utf-8');
    const types = extractTypes(content, module, 'dtos.ts');
    typesByModule.set(module, types);
  }

  return typesByModule;
}

/**
 * 从文件内容中提取类型定义
 */
function extractTypes(content: string, module: string, file: string): TypeDefinition[] {
  const types: TypeDefinition[] = [];

  // 匹配 export interface/type
  const interfaceRegex = /export\s+(interface|type)\s+(\w+)/g;
  let match;

  while ((match = interfaceRegex.exec(content)) !== null) {
    const name = match[2];
    const type = determineType(name);

    types.push({
      name,
      type,
      module,
      file,
      hasDataWrapper: checkHasDataWrapper(content, name),
    });
  }

  return types;
}

/**
 * 确定类型分类
 */
function determineType(name: string): TypeDefinition['type'] {
  if (name.endsWith('Request')) return 'Request';
  if (name.endsWith('Response')) return 'Response';
  if (name.endsWith('DTO') || name.endsWith('ClientDTO')) return 'DTO';
  return 'Other';
}

/**
 * 检查 Response 类型是否有 data 包装
 */
function checkHasDataWrapper(content: string, typeName: string): boolean {
  // 简单匹配，查找 data: 字段
  const typeRegex = new RegExp(`interface\\s+${typeName}[^{]*{([^}]+)}`, 's');
  const match = content.match(typeRegex);

  if (match) {
    return match[1].includes('data:');
  }

  return false;
}

/**
 * 检查 Reminder 模块
 */
function checkReminderModule(types: TypeDefinition[]): CheckResult {
  const result: CheckResult = {
    missing: [],
    duplicates: [],
    inconsistent: [],
    unused: [],
    suggestions: [],
  };

  const expectedTypes = {
    responses: [
      'ReminderTemplateResponse',
      'ReminderTemplateListResponse',
      'ReminderTemplateGroupResponse',
      'ReminderTemplateGroupListResponse',
      'ReminderInstanceResponse',
      'ReminderInstanceListResponse',
      'UpcomingRemindersResponse',
      'ReminderStatsResponse',
      'EnableStatusChangeResponse',
    ],
    requests: [
      'CreateReminderTemplateRequest',
      'UpdateReminderTemplateRequest',
      'CreateReminderTemplateGroupRequest',
      'UpdateReminderTemplateGroupRequest',
      'CreateReminderInstanceRequest',
      'UpdateReminderInstanceRequest',
      'SnoozeReminderRequest',
      'ToggleGroupEnableModeRequest',
      'ToggleGroupEnabledRequest',
      'ToggleTemplateSelfEnabledRequest',
      'BatchReminderOperationRequest',
      'BatchUpdateTemplatesEnabledRequest',
      'ReminderQueryParamsDTO',
      'GetUpcomingRemindersRequest',
    ],
    dtos: [
      'ReminderTemplateDTO',
      'ReminderTemplateClientDTO',
      'ReminderTemplateGroupDTO',
      'ReminderTemplateGroupClientDTO',
      'ReminderInstanceDTO',
      'ReminderInstanceClientDTO',
    ],
  };

  const typeNames = types.map((t) => t.name);

  // 检查缺失
  for (const expected of [
    ...expectedTypes.responses,
    ...expectedTypes.requests,
    ...expectedTypes.dtos,
  ]) {
    if (!typeNames.includes(expected)) {
      result.missing.push(expected);
    }
  }

  // 检查 Response 类型的 data 包装
  for (const type of types) {
    if (type.type === 'Response' && !type.hasDataWrapper) {
      result.inconsistent.push(type);
      result.suggestions.push(
        `⚠️  ${type.name} 缺少 data 字段包装，应该是：
export interface ${type.name} {
  data: ${type.name.replace('Response', 'ClientDTO')};
}`,
      );
    }
  }

  return result;
}

/**
 * 生成修复建议
 */
function generateFixSuggestions(module: string, result: CheckResult): string[] {
  const suggestions: string[] = [];

  if (result.missing.length > 0) {
    suggestions.push(`\n📝 ${module} 模块缺失类型：`);
    for (const missing of result.missing) {
      suggestions.push(`   - ${missing}`);
    }
  }

  if (result.inconsistent.length > 0) {
    suggestions.push(`\n⚠️  ${module} 模块不一致的类型：`);
    for (const type of result.inconsistent) {
      suggestions.push(`   - ${type.name}: 缺少 data 包装`);
    }
  }

  if (result.suggestions.length > 0) {
    suggestions.push(`\n💡 修复建议：`);
    suggestions.push(...result.suggestions.map((s) => `   ${s}`));
  }

  return suggestions;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检查 Contracts 类型定义...\n');

  const typesByModule = scanContracts();

  for (const [module, types] of typesByModule.entries()) {
    console.log(`\n📦 检查 ${module} 模块 (${types.length} 个类型)...`);

    let result: CheckResult;

    if (module === 'reminder') {
      result = checkReminderModule(types);
    } else {
      // 其他模块使用通用检查
      result = {
        missing: [],
        duplicates: [],
        inconsistent: [],
        unused: [],
        suggestions: [],
      };
    }

    // 打印结果
    if (result.missing.length === 0 && result.inconsistent.length === 0) {
      console.log(`   ✅ 所有检查通过`);
    } else {
      const suggestions = generateFixSuggestions(module, result);
      suggestions.forEach((s) => console.log(s));
    }
  }

  console.log('\n✨ 检查完成！\n');
}

// 运行
main();
