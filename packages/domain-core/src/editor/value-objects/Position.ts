// 临时类型定义，直到导入系统配置完成
enum SelectionDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward',
}

interface IPosition {
  line: number;
  column: number;
  offset: number;
}

interface ITextRange {
  start: IPosition;
  end: IPosition;
}

interface ITextSelection extends ITextRange {
  direction: SelectionDirection;
}

interface ICursorPosition {
  position: IPosition;
  isActive: boolean;
  blinkState: boolean;
}

/**
 * 位置值对象
 */
export class Position implements IPosition {
  constructor(
    public readonly line: number,
    public readonly column: number,
    public readonly offset: number,
  ) {
    if (line < 0 || column < 0 || offset < 0) {
      throw new Error('Position values must be non-negative');
    }
  }

  equals(other: Position): boolean {
    return this.line === other.line && this.column === other.column && this.offset === other.offset;
  }

  isBefore(other: Position): boolean {
    if (this.line !== other.line) {
      return this.line < other.line;
    }
    return this.column < other.column;
  }

  isAfter(other: Position): boolean {
    return other.isBefore(this);
  }

  toString(): string {
    return `Position(${this.line}, ${this.column}, ${this.offset})`;
  }

  static zero(): Position {
    return new Position(0, 0, 0);
  }

  static from(position: IPosition): Position {
    return new Position(position.line, position.column, position.offset);
  }
}

/**
 * 文本范围值对象
 */
export class TextRange implements ITextRange {
  constructor(
    public readonly start: Position,
    public readonly end: Position,
  ) {
    if (start.isAfter(end)) {
      throw new Error('TextRange start position must be before or equal to end position');
    }
  }

  get isEmpty(): boolean {
    return this.start.equals(this.end);
  }

  get length(): number {
    return this.end.offset - this.start.offset;
  }

  contains(position: Position): boolean {
    return !position.isBefore(this.start) && !position.isAfter(this.end);
  }

  containsRange(range: TextRange): boolean {
    return this.contains(range.start) && this.contains(range.end);
  }

  intersects(range: TextRange): boolean {
    return !this.end.isBefore(range.start) && !range.end.isBefore(this.start);
  }

  equals(other: TextRange): boolean {
    return this.start.equals(other.start) && this.end.equals(other.end);
  }

  toString(): string {
    return `TextRange(${this.start.toString()}, ${this.end.toString()})`;
  }

  static from(range: ITextRange): TextRange {
    return new TextRange(Position.from(range.start), Position.from(range.end));
  }
}

/**
 * 文本选择值对象
 */
export class TextSelection extends TextRange implements ITextSelection {
  constructor(
    start: Position,
    end: Position,
    public readonly direction: SelectionDirection,
  ) {
    super(start, end);
  }

  get isEmpty(): boolean {
    return super.isEmpty;
  }

  get isForward(): boolean {
    return this.direction === SelectionDirection.FORWARD;
  }

  get isBackward(): boolean {
    return this.direction === SelectionDirection.BACKWARD;
  }

  get anchor(): Position {
    return this.isForward ? this.start : this.end;
  }

  get active(): Position {
    return this.isForward ? this.end : this.start;
  }

  collapse(toStart: boolean = true): TextSelection {
    const position = toStart ? this.start : this.end;
    return new TextSelection(position, position, SelectionDirection.FORWARD);
  }

  reverse(): TextSelection {
    const newDirection = this.isForward ? SelectionDirection.BACKWARD : SelectionDirection.FORWARD;
    return new TextSelection(this.start, this.end, newDirection);
  }

  extend(newEnd: Position): TextSelection {
    return new TextSelection(
      this.anchor,
      newEnd,
      this.anchor.isBefore(newEnd) ? SelectionDirection.FORWARD : SelectionDirection.BACKWARD,
    );
  }

  static from(selection: ITextSelection): TextSelection {
    return new TextSelection(
      Position.from(selection.start),
      Position.from(selection.end),
      selection.direction,
    );
  }

  static fromRange(
    range: TextRange,
    direction: SelectionDirection = SelectionDirection.FORWARD,
  ): TextSelection {
    return new TextSelection(range.start, range.end, direction);
  }
}

/**
 * 光标位置值对象
 */
export class CursorPosition implements ICursorPosition {
  constructor(
    public readonly position: Position,
    public readonly isActive: boolean = true,
    public readonly blinkState: boolean = true,
  ) {}

  moveTo(newPosition: Position): CursorPosition {
    return new CursorPosition(newPosition, this.isActive, this.blinkState);
  }

  activate(): CursorPosition {
    return new CursorPosition(this.position, true, this.blinkState);
  }

  deactivate(): CursorPosition {
    return new CursorPosition(this.position, false, this.blinkState);
  }

  toggleBlink(): CursorPosition {
    return new CursorPosition(this.position, this.isActive, !this.blinkState);
  }

  equals(other: CursorPosition): boolean {
    return (
      this.position.equals(other.position) &&
      this.isActive === other.isActive &&
      this.blinkState === other.blinkState
    );
  }

  static from(cursor: ICursorPosition): CursorPosition {
    return new CursorPosition(Position.from(cursor.position), cursor.isActive, cursor.blinkState);
  }
}
