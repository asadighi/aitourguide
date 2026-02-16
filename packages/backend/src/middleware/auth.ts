import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../lib/jwt.js";

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

/**
 * Middleware that requires a valid JWT access token.
 * Populates req.auth with the decoded token payload.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware factory that requires a specific user role.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: TokenPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.auth.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        required_roles: roles,
        current_role: req.auth.role,
      });
      return;
    }

    next();
  };
}

