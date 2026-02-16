import { Request, Response, NextFunction } from "express";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty" }
      : undefined,
});

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      event: "http.request",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      latency_ms: Date.now() - start,
      request_id: req.requestId,
    });
  });

  next();
}

