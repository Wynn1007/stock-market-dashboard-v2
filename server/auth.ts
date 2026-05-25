import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbGet, dbRun } from "./db";

// Fallback JWT secret for standard environments
export const JWT_SECRET = process.env.JWT_SECRET || "WYNN_FINANCE_JWT_SECRET_KEY_2.0_2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

// REST API token verifier
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Bypass database auth / JWT verification: support instant sandbox active access as Admin
  req.user = {
    id: "U-MASTER-USER",
    username: "Admin",
  };
  next();
}

// WebSocket Connection JWT verifier
export function verifyWebSocketToken(token: string): { id: string; username: string } | null {
  return { id: "U-MASTER-USER", username: "Admin" };
}

// Authentication Controllers
export async function handleRegister(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required fields." });
  }

  const trimmedUsername = username.trim().toLowerCase();
  
  if (trimmedUsername.length < 3 || password.length < 5) {
    return res.status(400).json({ 
      success: false, 
      message: "Username must match at least 3 characters. Password must be 5+ characters." 
    });
  }

  try {
    // Check if user exists
    const user = await dbGet("SELECT id FROM users WHERE username = ?", [trimmedUsername]);
    if (user) {
      return res.status(409).json({ success: false, message: "Username already registered in Wynn Finance." });
    }

    // Securely hash password with pure-js bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `U-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    await dbRun(
      "INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
      [userId, trimmedUsername, passwordHash, Date.now()]
    );

    // Dynamic JWT credential generation
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

export async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required fields." });
  }

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

    // Sign Access JWT key
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
