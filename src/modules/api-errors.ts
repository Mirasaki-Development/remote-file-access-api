export enum APIErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  BAD_REQUEST = 'BAD_REQUEST',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  DIRECTORY_ACCESS_ERROR = 'DIRECTORY_ACCESS_ERROR',
  UNSUPPORTED_RESPONSE_TYPE = 'UNSUPPORTED_RESPONSE_TYPE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

interface APIErrorOptions {
  code: APIErrorCode;
  message?: string;
  status?: number;
  details?: Record<string, unknown>;
};

export class APIError extends Error {
  public readonly code: APIErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor({ code, message, status, details }: APIErrorOptions) {
    super(message || code);
    this.name = 'APIError';
    this.code = code;
    this.status = status ?? APIError.mapCodeToStatus(code);
    this.details = details;

    Object.setPrototypeOf(this, APIError.prototype);
  }

  static mapCodeToStatus(code: APIErrorCode): number {
    switch (code) {
    case APIErrorCode.UNAUTHORIZED: return 401;
    case APIErrorCode.FORBIDDEN: return 403;
    case APIErrorCode.NOT_FOUND: return 404;
      
    case APIErrorCode.BAD_REQUEST:
    case APIErrorCode.FILE_READ_ERROR:
    case APIErrorCode.DIRECTORY_ACCESS_ERROR:
    case APIErrorCode.UNSUPPORTED_RESPONSE_TYPE:
    default: return 500;
    }
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}
