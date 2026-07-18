declare namespace Express {
  export interface Request {
    user?: import('prisma/generated/client').User;
    session?: any;
    rawBody: any;
  }
}
