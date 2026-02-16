import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  generateTokens,
  verifyRefreshToken,
  type TokenPayload,
} from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

/**
 * POST /auth/google
 * Exchange a Google OAuth token for an app JWT.
 * Body: { idToken: string }
 *
 * In production, this verifies the Google ID token via Google's API
 * and extracts user info (email, name, sub).
 * For MVP, we accept the token and decode it without full verification.
 */
authRouter.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    // TODO: In production, verify idToken with Google's tokeninfo API
    // For now, we decode the payload section (base64) to get user info
    // This should be replaced with proper verification via googleapis
    const payload = decodeJwtPayload(idToken);

    if (!payload?.email || !payload?.sub) {
      res.status(400).json({ error: "Invalid Google ID token" });
      return;
    }

    const user = await findOrCreateUser({
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      oauthProvider: "google",
      oauthId: payload.sub,
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * POST /auth/apple
 * Exchange an Apple Sign-In identity token for an app JWT.
 * Body: { identityToken: string, fullName?: { givenName?: string, familyName?: string } }
 */
authRouter.post("/auth/apple", async (req: Request, res: Response) => {
  try {
    const { identityToken, fullName } = req.body;

    if (!identityToken) {
      res.status(400).json({ error: "identityToken is required" });
      return;
    }

    // TODO: In production, verify identityToken with Apple's JWKS
    const payload = decodeJwtPayload(identityToken);

    if (!payload?.email || !payload?.sub) {
      res.status(400).json({ error: "Invalid Apple identity token" });
      return;
    }

    const name =
      fullName?.givenName && fullName?.familyName
        ? `${fullName.givenName} ${fullName.familyName}`
        : payload.email.split("@")[0];

    const user = await findOrCreateUser({
      email: payload.email,
      name,
      oauthProvider: "apple",
      oauthId: payload.sub,
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (err) {
    console.error("Apple auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

/**
 * POST /auth/refresh
 * Exchange a refresh token for a new access + refresh token pair.
 * Body: { refreshToken: string }
 */
authRouter.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken is required" });
      return;
    }

    const { userId } = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * GET /auth/me
 * Return the current authenticated user's info.
 */
authRouter.get(
  "/auth/me",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.auth!.userId },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locale: user.locale,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

/**
 * POST /auth/dev-login (development only)
 * Quick login for development/testing without real OAuth.
 * Body: { email: string }
 */
if (process.env.NODE_ENV !== "production") {
  authRouter.post("/auth/dev-login", async (req: Request, res: Response) => {
    const { email, name, role } = req.body;

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const user = await findOrCreateUser({
      email,
      name: name || email.split("@")[0],
      oauthProvider: "google",
      oauthId: `dev-${email}`,
      role: role || "end_user",
    });

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  });
}

// ─── Helpers ────────────────────────────────────────

interface FindOrCreateUserParams {
  email: string;
  name: string;
  oauthProvider: "google" | "apple";
  oauthId: string;
  role?: string;
}

async function findOrCreateUser(params: FindOrCreateUserParams) {
  const existing = await prisma.user.findUnique({
    where: {
      oauth_provider_oauth_id: {
        oauth_provider: params.oauthProvider,
        oauth_id: params.oauthId,
      },
    },
  });

  if (existing) return existing;

  // Check if email already exists with different provider
  const byEmail = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (byEmail) {
    // Link to existing account by updating OAuth info
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        oauth_provider: params.oauthProvider,
        oauth_id: params.oauthId,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      role: (params.role as "end_user" | "ad_provider" | "admin") || "end_user",
      oauth_provider: params.oauthProvider,
      oauth_id: params.oauthId,
    },
  });
}

/**
 * Decode a JWT payload without verification (for extracting claims).
 * In production, use proper verification via provider-specific libraries.
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

