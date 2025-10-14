/**
 * UIConfig Value Object - Server Interface
 * UI配置值对象 - 服务端接口
 */

// ============ DTO 定义 ============

/**
 * UIConfig Server DTO
 */
export interface UIConfigServerDTO {
  inputType:
    | 'TEXT'
    | 'NUMBER'
    | 'SWITCH'
    | 'SELECT'
    | 'RADIO'
    | 'CHECKBOX'
    | 'SLIDER'
    | 'COLOR'
    | 'FILE';
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: Array<{ label: string; value: any }> | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
}

/**
 * UIConfig Persistence DTO
 */
export interface UIConfigPersistenceDTO {
  input_type: string;
  label?: string | null;
  placeholder?: string | null;
  help_text?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: string | null; // JSON string
  min?: number | null;
  max?: number | null;
  step?: number | null;
}

// ============ 值对象接口 ============

export interface UIConfigServer {
  inputType:
    | 'TEXT'
    | 'NUMBER'
    | 'SWITCH'
    | 'SELECT'
    | 'RADIO'
    | 'CHECKBOX'
    | 'SLIDER'
    | 'COLOR'
    | 'FILE';
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: Array<{ label: string; value: any }> | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;

  toServerDTO(): UIConfigServerDTO;
}

export interface UIConfigServerStatic {
  create(params: {
    inputType:
      | 'TEXT'
      | 'NUMBER'
      | 'SWITCH'
      | 'SELECT'
      | 'RADIO'
      | 'CHECKBOX'
      | 'SLIDER'
      | 'COLOR'
      | 'FILE';
    label?: string;
    placeholder?: string;
    helpText?: string;
    icon?: string;
    order?: number;
    visible?: boolean;
    disabled?: boolean;
    options?: Array<{ label: string; value: any }>;
    min?: number;
    max?: number;
    step?: number;
  }): UIConfigServer;
  fromServerDTO(dto: UIConfigServerDTO): UIConfigServer;
  fromPersistenceDTO(dto: UIConfigPersistenceDTO): UIConfigServer;
}
