import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: message });
};
