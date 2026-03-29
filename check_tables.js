const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_9JdZriB4qlfN@ep-wispy-mouse-ameuv59x-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(DATABASE_URL);

async function checkTables() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables in database:');
    for (const row of result) {
      console.log(' -', row.table_name);
    }
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
checkTables();
