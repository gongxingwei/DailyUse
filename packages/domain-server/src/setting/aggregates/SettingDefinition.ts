import { SettingContracts } from '@dailyuse/contracts';
import { SettingDefinitionCore } from '@dailyuse/domain-core';

type SettingType = SettingContracts.SettingType;
type SettingScope = SettingContracts.SettingScope;
type SettingCategory = SettingContracts.SettingCategory;
type SettingOption = SettingContracts.SettingOption;
type SettingValidationRule = SettingContracts.SettingValidationRule;

export class SettingDefinition extends SettingDefinitionCore {
    constructor(
        key: string,
        title: string,
        type: SettingType,
        scope: SettingScope,
        category: SettingCategory,
        defaultValue: any,
        description?: string,
        value?: any,
        options?: SettingOption[],
        validationRules?: SettingValidationRule[],
        readonly: boolean = false,
        hidden: boolean = false,
        requiresRestart: boolean = false,
        order: number = 0,
        dependsOn?: string[],
        tags?: string[],
    ) {
        super(
            key,
            title,
            type,
            scope,
            category,
            defaultValue,
            description,
            value,
            options,
            validationRules,
            readonly,
            hidden,
            requiresRestart,
            order,
            dependsOn,
            tags,
        );
    }

    createChangeRecord(){
        
    }
}
