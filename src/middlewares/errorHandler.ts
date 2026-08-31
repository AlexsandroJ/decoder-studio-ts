import { Request, Response, NextFunction } from "express";
import { IApiResponse } from "../types";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<IApiResponse>,
  _next: NextFunction
): void {
  console.error("❌ Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
}
