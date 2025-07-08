import type { IKeyResult, IKeyResultCreateDTO } from '../types/goal';

/**
 * 关键结果表单临时对象
 * 用于关键结果创建/编辑过程中的数据管理
 */
export class KeyResultForm {
    private _data: IKeyResultCreateDTO;
    
    constructor(initialData?: IKeyResultCreateDTO | IKeyResult) {
        if (initialData && 'id' in initialData) {
            // 从已有关键结果初始化
            this._data = this.fromKeyResult(initialData);
        } else {
            // 从DTO或空数据初始化
            this._data = this.getDefaultData(initialData);
        }
    }
    
    // 获取默认数据
    private getDefaultData(data?: IKeyResultCreateDTO): IKeyResultCreateDTO {
        return {
            name: data?.name || '',
            startValue: data?.startValue ?? 0,
            targetValue: data?.targetValue ?? 1,
            currentValue: data?.currentValue ?? 0,
            calculationMethod: data?.calculationMethod || 'sum',
            weight: data?.weight ?? 1
        };
    }
    
    // 从已有关键结果初始化
    private fromKeyResult(keyResult: IKeyResult): IKeyResultCreateDTO {
        return {
            name: keyResult.name,
            startValue: keyResult.startValue,
            targetValue: keyResult.targetValue,
            currentValue: keyResult.currentValue,
            calculationMethod: keyResult.calculationMethod,
            weight: keyResult.weight
        };
    }
    
    // Getter/Setter for name
    get name(): string {
        return this._data.name;
    }
    
    set name(value: string) {
        this._data.name = value;
    }
    
    // Getter/Setter for startValue
    get startValue(): number {
        return this._data.startValue;
    }
    
    set startValue(value: number) {
        this._data.startValue = value;
    }
    
    // Getter/Setter for targetValue
    get targetValue(): number {
        return this._data.targetValue;
    }
    
    set targetValue(value: number) {
        this._data.targetValue = value;
    }
    
    // Getter/Setter for currentValue
    get currentValue(): number {
        return this._data.currentValue;
    }
    
    set currentValue(value: number) {
        this._data.currentValue = value;
    }
    
    // Getter/Setter for calculationMethod
    get calculationMethod(): 'sum' | 'average' | 'max' | 'min' | 'custom' {
        return this._data.calculationMethod;
    }
    
    set calculationMethod(value: 'sum' | 'average' | 'max' | 'min' | 'custom') {
        this._data.calculationMethod = value;
    }
    
    // Getter/Setter for weight
    get weight(): number {
        return this._data.weight;
    }
    
    set weight(value: number) {
        this._data.weight = value;
    }
    
    // 获取完整的创建DTO
    toCreateDTO(): IKeyResultCreateDTO {
        if (!this.isValid()) {
            throw new Error('关键结果表单数据不完整，无法转换为创建DTO');
        }
        
        return {
            name: this.name,
            startValue: this.startValue,
            targetValue: this.targetValue,
            currentValue: this.currentValue,
            calculationMethod: this.calculationMethod as any,
            weight: this.weight
        };
    }
    
    // 验证表单数据
    isValid(): boolean {
        return !!(
            this.name &&
            this.name.trim().length > 0 &&
            this.targetValue > this.startValue &&
            this.weight >= 0 &&
            this.weight <= 10
        );
    }
    
    // 获取验证错误
    getValidationErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        
        if (!this.name || this.name.trim().length === 0) {
            errors.name = '关键结果名称不能为空';
        }
        
        if (this.startValue < 0) {
            errors.startValue = '起始值不能小于0';
        }
        
        if (this.targetValue <= this.startValue) {
            errors.targetValue = '目标值必须大于起始值';
        }
        
        if (this.weight < 0 || this.weight > 10) {
            errors.weight = '权重必须在0-10之间';
        }
        
        return errors;
    }
    
    // 重置表单
    reset(): void {
        this._data = this.getDefaultData();
    }
    
    // 计算完成百分比
    get progressPercentage(): number {
        if (this.targetValue === this.startValue) return 0;
        const progress = (this.currentValue - this.startValue) / (this.targetValue - this.startValue);
        return Math.max(0, Math.min(100, progress * 100));
    }
}
