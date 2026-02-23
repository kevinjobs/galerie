export class MyError extends Error {
  status = 418;
  code = 9000;

  constructor(message: string) {
    super(message);
  }

  toResponse() {
    return Response.json({
      error: this.message,
      code: this.code,
    }, {
      status: 418,
    });
  }
}


export class PermissionError extends MyError {
  constructor(message: string) {
    super(message);
    this.code = 9001;
  }
}

export class WrongPasswordError extends MyError {
  constructor(message: string) {
    super(message);
    this.code = 9002;
  }
}

export class UniqueError extends MyError {
  constructor(message: string) {
    super(message);
    this.code = 9003;
  }
}

export class NotFoundError extends MyError {
  constructor(message: string) {
    super(message);
    this.code = 9004;
  }
}
