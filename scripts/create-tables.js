/**
 * Create database tables directly
 */

const Database = require("better-sqlite3")
const path = require("path")
const fs = require("fs")

const dbPath = path.join(process.cwd(), "drizzle.db")

if (!fs.existsSync(dbPath)) {
  const db = new Database(dbPath)
  db.close()
  console.log("Created drizzle.db")
}

const db = new Database(dbPath)

try {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      api_key TEXT,
      api_key_created_at INTEGER,
      plan TEXT NOT NULL DEFAULT 'free',
      plan_expires_at INTEGER,
      bandwidth_used INTEGER NOT NULL DEFAULT 0,
      bandwidth_limit INTEGER NOT NULL DEFAULT 104857600,
      role TEXT NOT NULL DEFAULT 'user',
      is_admin INTEGER NOT NULL DEFAULT 0,
      banned INTEGER NOT NULL DEFAULT 0
    )
  `)
  
  // Create api_keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      scopes TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      last_used_at INTEGER,
      expires_at INTEGER,
      revoked_at INTEGER,
      rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
      rate_limit_per_day INTEGER NOT NULL DEFAULT 5000,
      usage_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_keys_deleted_at_idx ON api_keys(deleted_at)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON api_keys(prefix)`)
  
  // Create api_key_usages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_key_usages (
      id TEXT PRIMARY KEY,
      api_key_id TEXT NOT NULL,
      route TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL DEFAULT 1,
      latency_ms INTEGER,
      timestamp INTEGER NOT NULL,
      deleted_at INTEGER,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
    )
  `)
  
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS api_key_usages_api_key_id_idx ON api_key_usages(api_key_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_key_usages_timestamp_idx ON api_key_usages(timestamp)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_key_usages_route_idx ON api_key_usages(route)`)
  db.exec(`CREATE INDEX IF NOT EXISTS api_key_usages_deleted_at_idx ON api_key_usages(deleted_at)`)
  
  // Create payment_plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_ngn INTEGER NOT NULL DEFAULT 0,
      rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
      rate_limit_per_day INTEGER NOT NULL DEFAULT 1000,
      raenest_link TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  
  // Create user_subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      raenest_payment_id TEXT,
      starts_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES payment_plans(id) ON DELETE RESTRICT
    )
  `)
  
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS user_subscriptions_plan_id_idx ON user_subscriptions(plan_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status)`)
  
  console.log("✅ All tables created successfully")
} catch (error) {
  console.error("❌ Error creating tables:", error.message)
  process.exit(1)
} finally {
  db.close()
}

