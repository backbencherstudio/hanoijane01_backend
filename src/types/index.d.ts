declare global {
  namespace Express {
    interface User {
      id?: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
      session?: any;
      rawBody?: any;
    }
  }
}

export {};
