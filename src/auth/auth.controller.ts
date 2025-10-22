import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // Ensure id is included
        email: string;
        username?: string;
      };
    }
  }
}
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: "Invalid email format" });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res
        .status(409)
        .json({ success: false, message: "Email already registered" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: username || null, email, password: hashed },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { id: user.id, email: user.email, created_at: user.created_at },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const secret: string = process.env.JWT_SECRET as string;
    if (!secret) {
      res
        .status(500)
        .json({ success: false, message: "JWT secret not configured" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { access_token: token },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
