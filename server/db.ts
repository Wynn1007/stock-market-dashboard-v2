import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "wynn_finance.db");

// Use verbose mode for helpful logging
const sqlite = sqlite3.verbose();

export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to Wynn Finance SQLite database successfully.");
  }
});

// Wrap DB operations inside promises for neat async/await flow
export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: any; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

// Set up database schema
export async function initializeDatabase() {
  try {
    // Enable WAL mode for high currency and performance in simulation
    await dbRun("PRAGMA journal_mode = WAL;");
    await dbRun("PRAGMA foreign_keys = ON;");

    // 1. Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);

    // 2. Ledger table (Financial Bookkeeping)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS ledger (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL, -- 'income' | 'expense'
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        description TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Orders / Transactions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL, -- 'BUY' | 'SELL'
        price REAL NOT NULL,
        qty REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create a default administrator user if none exists
    const adminExists = await dbGet("SELECT id FROM users WHERE username = ?", ["admin"]);
    if (!adminExists) {
      // Create user "admin" with password "admin123"
      // Salted hash for bcrypt
      import("bcryptjs").then(async (bcrypt) => {
        const passwordHash = await bcrypt.hash("admin123", 10);
        await dbRun(
          "INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
          ["admin-uuid", "admin", passwordHash, Date.now()]
        );
        console.log("[DB] Default admin created successfully. (admin / admin123)");
        
        // Populate default ledger entries
        await dbRun(`
          INSERT OR IGNORE INTO ledger (id, userId, type, category, amount, date, description, createdAt)
          VALUES 
          ('init-ledger-1', 'admin-uuid', 'income', 'Salary', 120000.0, '2026-05-01', 'May Core Salary', ${Date.now()}),
          ('init-ledger-2', 'admin-uuid', 'income', 'Invest', 15400.0, '2026-05-10', 'TSMC Dividend Payout', ${Date.now() - 86400000}),
          ('init-ledger-3', 'admin-uuid', 'expense', 'Rent', 32000.0, '2026-05-05', 'Office Rent Fee', ${Date.now() - 172800000}),
          ('init-ledger-4', 'admin-uuid', 'expense', 'Food', 1850.0, '2026-05-24', 'Client Banquet Luncheon', ${Date.now() - 36400000})
        `);
      });
    }

    // Create bypassed admin user if not exists to support zero-friction sandbox mode
    const masterAdminExists = await dbGet("SELECT id FROM users WHERE id = ?", ["U-MASTER-USER"]);
    if (!masterAdminExists) {
      import("bcryptjs").then(async (bcrypt) => {
        const passwordHash = await bcrypt.hash("admin123", 12);
        await dbRun(
          "INSERT OR IGNORE INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
          ["U-MASTER-USER", "Admin", passwordHash, Date.now()]
        );
        
        // Add initial ledger entries for Admin U-MASTER-USER
        await dbRun(`
          INSERT OR IGNORE INTO ledger (id, userId, type, category, amount, date, description, createdAt)
          VALUES 
          ('init-ledger-admin-1', 'U-MASTER-USER', 'income', 'Salary', 150000.0, '2026-05-01', 'May Lead Architect Compensation', ${Date.now()}),
          ('init-ledger-admin-2', 'U-MASTER-USER', 'income', 'Invest', 28430.0, '2026-05-12', 'NVIDIA Option Profit Settlement', ${Date.now() - 86400000}),
          ('init-ledger-admin-3', 'U-MASTER-USER', 'expense', 'Rent', 46000.0, '2026-05-05', 'Wynn Finance Premium Studio Rent', ${Date.now() - 172800000}),
          ('init-ledger-admin-4', 'U-MASTER-USER', 'expense', 'Food', 2450.0, '2026-05-25', 'Executive Board Dinner Banquet', ${Date.now()})
        `);
        console.log("[DB] Default Master Admin (Admin / U-MASTER-USER) initialized successfully.");
      });
    }

    console.log("[DB] Schema initialized successfully.");
  } catch (err: any) {
    console.error("[DB] Critical failure inside Database Bootstrapper:", err.message);
  }
}
