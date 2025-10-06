/**
 * Mock for @nestjs/common in test environment
 * 测试环境中的 @nestjs/common Mock
 */

// Decorator Mocks
export function Injectable(): ClassDecorator {
  return (target: any) => target;
}

export function Controller(prefix?: string): ClassDecorator {
  return (target: any) => target;
}

export function Get(path?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
}

export function Post(path?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
}

export function Put(path?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
}

export function Delete(path?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
}

export function Patch(path?: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
}

// Lifecycle Interfaces
export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}

export interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void;
}

// Parameter Decorators
export function Param(property?: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
}

export function Body(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
}

export function Query(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
}

export function Req(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
}

export function Res(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {};
}

// HTTP Status
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// HTTP Exception
export class HttpException extends Error {
  constructor(
    public response: string | object,
    public status: number,
  ) {
    super(typeof response === 'string' ? response : JSON.stringify(response));
  }
}

// Common Exceptions
export class BadRequestException extends HttpException {
  constructor(message?: string) {
    super(message || 'Bad Request', HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundException extends HttpException {
  constructor(message?: string) {
    super(message || 'Not Found', HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message?: string) {
    super(message || 'Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message?: string) {
    super(message || 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message?: string) {
    super(message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
