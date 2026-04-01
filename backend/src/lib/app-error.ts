export class AppError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(message: string, status = 400, detail?: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.detail = detail;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequest(message: string, detail?: string): never {
  throw new AppError(message, 400, detail);
}

export function unauthorized(message = "Unauthorized", detail?: string): never {
  throw new AppError(message, 401, detail);
}

export function forbidden(message = "Forbidden", detail?: string): never {
  throw new AppError(message, 403, detail);
}

export function notFound(message = "Not found", detail?: string): never {
  throw new AppError(message, 404, detail);
}

export function conflict(message: string, detail?: string): never {
  throw new AppError(message, 409, detail);
}

