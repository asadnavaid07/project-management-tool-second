const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

process.env.JWT_SECRET = process.env.JWT_SECRET || "company2-jwt-secret-token-key-2026";

let pool;

async function initDatabase(poolInstance, isRealPostgres = false) {
  try {
    const client = await poolInstance.connect();
    try {
      console.log("🚀 Initializing Company 2 database schema...");

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'Member',
          job_title TEXT DEFAULT 'Specialist',
          remarks TEXT DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS programs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT,
          description TEXT,
          domain TEXT,
          priority TEXT DEFAULT 'Medium',
          status TEXT DEFAULT 'Active',
          start_date DATE,
          end_date DATE,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          domain TEXT,
          about_title TEXT,
          about_description TEXT,
          status TEXT DEFAULT 'Active',
          priority TEXT DEFAULT 'Medium',
          start_date DATE,
          deadline DATE,
          progress INTEGER DEFAULT 0,
          program_id TEXT,
          manager_id TEXT,
          project_manager_id TEXT,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS program_projects (
          id TEXT PRIMARY KEY,
          program_id TEXT NOT NULL,
          name TEXT NOT NULL,
          domain TEXT,
          about_title TEXT,
          about_description TEXT,
          status TEXT DEFAULT 'In Progress',
          priority TEXT DEFAULT 'Medium',
          start_date DATE,
          deadline DATE,
          created_by TEXT,
          assigned_to TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_members (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT DEFAULT 'Contributor',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS team_members (
          team_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (team_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          title TEXT,
          description TEXT,
          status TEXT DEFAULT 'To Do',
          priority TEXT DEFAULT 'Medium',
          start_date DATE,
          due_date DATE,
          project_id TEXT,
          assignee_id TEXT,
          assigned_to TEXT,
          created_by TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS program_project_tasks (
          id TEXT PRIMARY KEY,
          program_project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'To Do',
          priority TEXT DEFAULT 'Medium',
          assigned_to TEXT,
          due_date DATE,
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS program_project_members (
          program_project_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          assigned_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (program_project_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS task_work_parts (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'To Do',
          created_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS task_submissions (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          link TEXT,
          description TEXT,
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS task_challenges (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          challenge TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS task_attachments (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT,
          mime_type TEXT,
          file_size INTEGER DEFAULT 0,
          file_path TEXT,
          file_content BYTEA,
          uploaded_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS project_reports (
          id TEXT PRIMARY KEY DEFAULT 'rpt-' || extract(epoch from now())::bigint || '-' || floor(random()*1000000)::text,
          project_id TEXT NOT NULL UNIQUE,
          title TEXT,
          content TEXT,
          format TEXT DEFAULT 'text',
          file_path TEXT,
          submitted_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS daily_updates (
          id TEXT PRIMARY KEY DEFAULT 'dup-' || extract(epoch from now())::bigint || '-' || floor(random()*1000000)::text,
          user_id TEXT NOT NULL,
          date DATE DEFAULT CURRENT_DATE,
          content TEXT NOT NULL,
          kpi_score NUMERIC,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Column & constraint migrations
        ALTER TABLE users ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '';
        ALTER TABLE task_submissions ALTER COLUMN link DROP NOT NULL;
      `);

      if (isRealPostgres) {
        const idMigrations = [
          `ALTER TABLE programs ALTER COLUMN id SET DEFAULT ('prog-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE projects ALTER COLUMN id SET DEFAULT ('proj-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE program_projects ALTER COLUMN id SET DEFAULT ('pp-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE tasks ALTER COLUMN id SET DEFAULT ('tsk-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE program_project_tasks ALTER COLUMN id SET DEFAULT ('ppt-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE project_members ALTER COLUMN id SET DEFAULT ('pm-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE task_attachments ALTER COLUMN id SET DEFAULT ('att-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE task_challenges ALTER COLUMN id SET DEFAULT ('ch-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE task_submissions ALTER COLUMN id SET DEFAULT ('sub-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE task_work_parts ALTER COLUMN id SET DEFAULT ('twp-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`,
          `ALTER TABLE teams ALTER COLUMN id SET DEFAULT ('tm-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10));`
        ];
        for (const m of idMigrations) {
          try {
            await client.query(m);
          } catch (e) {
            // Silently ignore if already applied
          }
        }
      }

      // Seed ONLY the dedicated System Administrator for Company 2
      const adminPassword = "Admin@Company2#2026";
      const adminHash = bcrypt.hashSync(adminPassword, 10);

      await client.query(`
        INSERT INTO users (id, full_name, email, password_hash, role, job_title, remarks, is_active)
        VALUES 
          ('usr-admin-company2', 'System Administrator', 'admin@company2.com', '${adminHash}', 'System Administrator', 'Enterprise System Administrator', 'Main Admin for Company 2', true)
        ON CONFLICT (email) DO UPDATE SET 
          full_name = EXCLUDED.full_name,
          password_hash = '${adminHash}',
          role = 'System Administrator',
          is_active = true,
          updated_at = NOW();
      `);

      console.log("✅ Company 2 Database schema & System Administrator synchronized successfully!");

    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

if (process.env.DATABASE_URL) {
  console.log("Connecting to PostgreSQL / Neon via DATABASE_URL...");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("connect", () => {
    console.log("PostgreSQL connection established");
  });

  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err);
  });

  // Run schema creation on real PostgreSQL database
  initDatabase(pool, true);
} else {
  console.log("⚡ DATABASE_URL not found: Initializing Local In-Memory PostgreSQL (pg-mem)...");
  const { newDb } = require("pg-mem");
  const mem = newDb();

  // Register common pg functions
  mem.public.registerFunction({
    name: "now",
    args: [],
    returns: mem.public.getType("timestamp with time zone"),
    implementation: () => new Date(),
  });

  const pg = mem.adapters.createPg();
  pool = new pg.Pool();

  initDatabase(pool, false);
}

module.exports = pool;
