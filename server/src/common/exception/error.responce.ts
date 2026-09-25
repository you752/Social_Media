import { IError } from "../interfaces/Error.interface";

export class ApplicationException extends Error implements IError {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export class BadRequestException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 400, data);
  }
}

export class UnAuthorizedException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 401, data);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 404, data);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 409, data);
  }
}

export class InternalServerErrorException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 500, data);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string, data?: any) {
    super(message, 403, data);
  }
}
