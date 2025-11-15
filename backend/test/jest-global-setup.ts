import { runSeeders } from '../src/database/seeders';

export default async () => {
  console.log('\n🌍 Running global test setup...\n');

  // Run seeders with clear flag to start fresh
  await runSeeders(true);

  console.log('\n✅ Global test setup complete\n');
};
