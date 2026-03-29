const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_9JdZriB4qlfN@ep-wispy-mouse-ameuv59x-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(DATABASE_URL);

async function addTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS comments (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, author_id VARCHAR(255) NOT NULL, author_name VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reactions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, user_id VARCHAR(255) NOT NULL, emoji VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, UNIQUE(user_id, post_id))`,
    `CREATE TABLE IF NOT EXISTS notifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id VARCHAR(255) NOT NULL, family_id UUID, type VARCHAR(50) NOT NULL, related_id UUID, message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`
  ];
  
  for (const q of tables) {
    try {
      await sql`CREATE TABLE IF NOT EXISTS comments (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, author_id VARCHAR(255) NOT NULL, author_name VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`;
      console.log('OK: comments');
    } catch(e) {}
    try {
      await sql`CREATE TABLE IF NOT EXISTS reactions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, post_id UUID REFERENCES posts(id) ON DELETE CASCADE, user_id VARCHAR(255) NOT NULL, emoji VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, UNIQUE(user_id, post_id))`;
      console.log('OK: reactions');
    } catch(e) {}
    try {
      await sql`CREATE TABLE IF NOT EXISTS notifications (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id VARCHAR(255) NOT NULL, family_id UUID, type VARCHAR(50) NOT NULL, related_id UUID, message TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL)`;
      console.log('OK: notifications');
    } catch(e) {}
  }
  
  // Verify
  const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('\nAll tables now:');
  for (const row of result) console.log(' -', row.table_name);
  process.exit(0);
}
addTables();
