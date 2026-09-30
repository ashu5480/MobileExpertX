/**
 * Runs every test file in this folder and reports a combined result.
 * Requires a production build running on http://localhost:3000:
 *   npm run build && npm start
 *   npm test
 */
const { spawnSync } = require('child_process');
const path = require('path');

const FILES = [
  'services.test.cjs',
  'orders.test.cjs',
  'catalogue.test.cjs',
  'seo.test.cjs',
  'auth.e2e.cjs',
  'catalogue-admin.e2e.cjs',
];

// auth.e2e.cjs and catalogue-admin.e2e.cjs exercise the admin sign-in, which
// only exists when the admin credentials are configured. Without them they
// still run everything else and print a skip notice.
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.log(
    'NOTE  ADMIN_EMAIL / ADMIN_PASSWORD are not set: the admin sign-in checks ' +
      'in auth.e2e.cjs and catalogue-admin.e2e.cjs will be skipped.',
  );
}

let totalPass = 0;
let totalFail = 0;

for (const file of FILES) {
  console.log(`\n${'='.repeat(60)}\n${file}\n${'='.repeat(60)}`);
  const res = spawnSync(process.execPath, [path.join(__dirname, file)], {
    stdio: 'inherit',
  });
  if (res.status !== 0) totalFail += 1;
}

// Count assertions from the last run of each file for a summary line.
console.log(`\n${'='.repeat(60)}`);
console.log(
  totalFail === 0
    ? 'All test files passed.'
    : `${totalFail} test file(s) reported failures.`,
);
process.exitCode = totalFail === 0 ? 0 : 1;
void totalPass;
