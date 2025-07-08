import type { IGoal, IGoalCreateDTO, IKeyResultCreateDTO } from '../types/goal';

/**
 * 目标分析接口
 */
interface IGoalAnalysis {
    motive: string;
    feasibility: string;
}

/**
 * 目标表单临时对象
 * 用于目标创建/编辑过程中的数据管理
 */
export class GoalForm {
    private _data: Partial<IGoalCreateDTO>;
    
    constructor(initialData?: Partial<IGoalCreateDTO> | IGoal) {
        if (initialData && 'id' in initialData) {
            // 从已有目标初始化
            this._data = this.fromGoal(initialData);
        } else {
            // 从DTO或空数据初始化
            this._data = this.getDefaultData(initialData);
        }
    }
    
    // 获取默认数据
    private getDefaultData(data?: Partial<IGoalCreateDTO>): Partial<IGoalCreateDTO> {
        return {
            title: data?.title || '',
            description: data?.description || '',
            color: data?.color || '#FF5733',
            dirId: data?.dirId || '',
            startTime: data?.startTime || undefined,
            endTime: data?.endTime || undefined,
            note: data?.note || '',
            keyResults: data?.keyResults || [],
            analysis: data?.analysis || {
                motive: '',
                feasibility: ''
            }
        };
    }
    
    // 从已有目标初始化
    private fromGoal(goal: IGoal): Partial<IGoalCreateDTO> {
        return {
            title: goal.title,
            description: goal.description,
            color: goal.color,
            dirId: goal.dirId,
            startTime: goal.startTime,
            endTime: goal.endTime,
            note: goal.note,
            keyResults: goal.keyResults.map(kr => ({
                name: kr.name,
                startValue: kr.startValue,
                targetValue: kr.targetValue,
                currentValue: kr.currentValue,
                calculationMethod: kr.calculationMethod,
                weight: kr.weight
            })),
            analysis: {
                motive: goal.analysis.motive,
                feasibility: goal.analysis.feasibility
            }
        };
    }
    
    // Getter/Setter for title
    get title(): string {
        return this._data.title || '';
    }
    
    set title(value: string) {
        this._data.title = value;
    }
    
    // Getter/Setter for description
    get description(): string | undefined {
        return this._data.description;
    }
    
    set description(value: string | undefined) {
        this._data.description = value;
    }
    
    // Getter/Setter for color
    get color(): string {
        return this._data.color || '#FF5733';
    }
    
    set color(value: string) {
        this._data.color = value;
    }
    
    // Getter/Setter for dirId
    get dirId(): string {
        return this._data.dirId || '';
    }
    
    set dirId(value: string) {
        this._data.dirId = value;
    }
    
    // Getter/Setter for startTime
    get startTime() {
        return this._data.startTime;
    }
    
    set startTime(value: any) {
        this._data.startTime = value;
    }
    
    // Getter/Setter for endTime
    get endTime() {
        return this._data.endTime;
    }
    
    set endTime(value: any) {
        this._data.endTime = value;
    }
    
    // Getter/Setter for note
    get note(): string | undefined {
        return this._data.note;
    }
    
    set note(value: string | undefined) {
        this._data.note = value;
    }
    
    // Getter/Setter for keyResults
    get keyResults(): IKeyResultCreateDTO[] {
        return this._data.keyResults || [];
    }
    
    set keyResults(value: IKeyResultCreateDTO[]) {
        this._data.keyResults = value;
    }
    
    // Getter/Setter for analysis
    get analysis(): IGoalAnalysis {
        return this._data.analysis || { motive: '', feasibility: '' };
    }
    
    set analysis(value: IGoalAnalysis) {
        this._data.analysis = value;
    }
    
    // 获取完整的创建DTO
    toCreateDTO(): IGoalCreateDTO {
        if (!this.isValid()) {
            throw new Error('目标表单数据不完整，无法转换为创建DTO');
        }
        
        return {
            title: this.title,
            description: this.description,
            color: this.color,
            dirId: this.dirId,
            startTime: this.startTime!,
            endTime: this.endTime!,
            note: this.note,
            keyResults: this.keyResults,
            analysis: this.analysis
        };
    }
    
    // 验证表单数据
    isValid(): boolean {
        return !!(
            this.title &&
            this.title.trim().length > 0 &&
            this.dirId &&
            this.startTime &&
            this.endTime &&
            this.color
        );
    }
    
    // 获取验证错误
    getValidationErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        
        if (!this.title || this.title.trim().length === 0) {
            errors.title = '目标标题不能为空';
        }
        
        if (!this.dirId) {
            errors.dirId = '请选择目标目录';
        }
        
        if (!this.startTime) {
            errors.startTime = '开始时间不能为空';
        }
        
        if (!this.endTime) {
            errors.endTime = '结束时间不能为空';
        }
        
        if (this.startTime && this.endTime) {
            const start = new Date(this.startTime.timestamp);
            const end = new Date(this.endTime.timestamp);
            if (start >= end) {
                errors.endTime = '结束时间必须晚于开始时间';
            }
        }
        
        return errors;
    }
    
    // 重置表单
    reset(): void {
        this._data = this.getDefaultData();
    }
    
    // 添加关键结果
    addKeyResult(): void {
        const newKeyResult: IKeyResultCreateDTO = {
            name: '',
            startValue: 0,
            targetValue: 100,
            currentValue: 0,
            calculationMethod: 'sum',
            weight: 5
        };
        
        if (!this._data.keyResults) {
            this._data.keyResults = [];
        }
        
        this._data.keyResults.push(newKeyResult);
    }
    
    // 移除关键结果
    removeKeyResult(index: number): void {
        if (this._data.keyResults && index >= 0 && index < this._data.keyResults.length) {
            this._data.keyResults.splice(index, 1);
        }
    }
    
    // 更新关键结果
    updateKeyResult(index: number, field: keyof IKeyResultCreateDTO, value: any): void {
        if (this._data.keyResults && index >= 0 && index < this._data.keyResults.length) {
            (this._data.keyResults[index] as any)[field] = value;
        }
    }
    
    // 获取关键结果
    getKeyResult(index: number): IKeyResultCreateDTO | undefined {
        return this._data.keyResults?.[index];
    }
}
