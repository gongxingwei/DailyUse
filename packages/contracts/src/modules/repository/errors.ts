/**
 * Repository module error types
 */

/**
 * 仓储操作错误
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Git操作错误
 */
export class GitOperationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'GitOperationError';
  }
}
