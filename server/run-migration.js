import { migrateDatabase } from './src/db/migrate.js';

async function runMigration() {
  try {
    console.log('Running database migration...');
    await migrateDatabase();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
