const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_9JdZriB4qlfN@ep-wispy-mouse-ameuv59x-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(DATABASE_URL);

async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS families (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name VARCHAR(255) NOT NULL, created_by VARCHAR(255) NOT NULL, invite_code_hash VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS family_memberships (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_id UUID REFERENCES families(id) ON DELETE CASCADE, user_id VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'member', joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, UNIQUE(family_id, user_id))`,
    `CREATE TABLE IF NOT EXISTS invites (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_id UUID REFERENCES families(id) ON DELETE CASCADE, email VARCHAR(255) NOT NULL, status VARCHAR(50) NOT NULL DEFAULT 'pending', expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS posts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_id UUID REFERENCES families(id) ON DELETE CASCADE, author_id VARCHAR(255) NOT NULL, content TEXT, media_url TEXT, media_type VARCHAR(50), author_name VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS calendar_events (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, family_id UUID REFERENCES families(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, description TEXT, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, all_day BOOLEAN DEFAULT FALSE, type VARCHAR(50) DEFAULT 'other', created_by VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS comments (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, author_id VARCHAR(255) NOT NULL, author_name VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reactions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, user_id VARCHAR(255) NOT NULL, emoji VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, UNIQUE(user_id, post_id))`,
    `CREATE TABLE IF NOT EXISTS notifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id VARCHAR(255) NOT NULL, family_id UUID, type VARCHAR(50) NOT NULL, related_id UUID, message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`
  ];
  
  for (const q of tables) {
    try {
      await sql(q);
      console.log('OK:', q.substring(0, 60));
    } catch(e) {
      console.error('ERR:', e.message.substring(0, 100));
    }
  }
  console.log('\nAll tables created!');
  process.exit(0);
}
createTables();
