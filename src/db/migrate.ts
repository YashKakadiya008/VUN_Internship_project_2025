import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from '@/db';
import config from '@/../drizzle.config';

async function main() {

  await migrate(db, {
    migrationsFolder: config.out!,
  });

  // Gracefully close the Turso client connection
  await client.close();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
