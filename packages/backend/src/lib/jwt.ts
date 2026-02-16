import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "end_user" | "ad_provider" | "admin";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate an access + refresh token pair for a user.
 */
export function generateTokens(payload: TokenPayload): TokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

/**
 * Verify and decode an access token.
 */
export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

/**
 * Verify a refresh token and return the userId.
 */
export function verifyRefreshToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    type: string;
  };
  if (decoded.type !== "refresh") {
    throw new Error("Invalid token type");
  }
  return { userId: decoded.userId };
}

