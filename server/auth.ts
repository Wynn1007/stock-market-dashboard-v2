import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { dbGet, dbRun } from "./db";
import { validate, RegisterSchema, LoginSchema } from "./validation";

// Fallback JWT secret for standard environments
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. Please set it in your .env file.");
  process.exit(1);
}

export const authRouter = Router();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// REST API token verifier
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token required." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

// WebSocket Connection JWT verifier
export function verifyWebSocketToken(token: string): { id: string; username: string } | null {
  try {
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch (err) {
    return null;
  }
}

// Authentication Controllers
async function handleRegister(req: Request, res: Response) {
  const { username, password } = req.body;
  const trimmedUsername = username.trim().toLowerCase();

  try {
    const user = await dbGet("SELECT id FROM users WHERE username = ?", [trimmedUsername]);
    if (user) {
      return res.status(409).json({ success: false, message: "Username already registered in Wynn Finance." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await dbRun(
      "INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
      [userId, trimmedUsername, passwordHash, Date.now()]
    );

    const token = jwt.sign({ id: userId, username: trimmedUsername }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "Registration completed successfully.",
      user: { id: userId, username: trimmedUsername },
      token,
    });
  } catch (err: any) {
    console.error("Registration endpoint failed:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  const trimmedUsername = username.trim().toLowerCase();

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ?", [trimmedUsername]);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password credentials." });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Logged in successfully to Wynn Finance Hub.",
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err: any) {
    console.error("Login verification endpoint failed:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// --- Mount routes with validation ---
authRouter.post("/register", validate(RegisterSchema), handleRegister);
authRouter.post("/login", validate(LoginSchema), handleLogin);

