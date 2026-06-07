import { z } from "zod";
import { NextFunction, Request, Response } from "express";

// --- Base Schemas ---

export const RegisterSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be 20 characters or less"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const LedgerEntrySchema = z.object({
  body: z.object({
    type: z.enum(["income", "expense"]),
    category: z.string().min(1, "Category is required"),
    amount: z.number().positive("Amount must be a positive number"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    description: z.string().optional(),
  }),
});

export const WatchlistSchema = z.object({
  body: z.object({
    symbol: z.string().min(1).max(20),
  }),
});

export const WebhookSchema = z.object({
  body: z.object({
    webhookUrl: z.string().url("Must be a valid URL for webhook").or(z.literal("")).optional(),
    url: z.string().url("Must be a valid URL for url").or(z.literal("")).optional(),
  }).refine(data => data.url !== undefined || data.webhookUrl !== undefined, {
    message: "Either url or webhookUrl must be provided",
  }),
});


export const OrderSchema = z.object({
  body: z.object({
    symbol: z.string().min(1).max(20),
    type: z.enum(["BUY", "SELL"]),
    qty: z.number().positive(),
    price: z.number().positive(),
  }),
});

// --- Validation Middleware ---

export const validate = (schema: z.ZodObject<any, any>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({ success: false, errors: issues });
      }
      return res.status(500).json({ success: false, message: "Internal server error during validation." });
    }
};
