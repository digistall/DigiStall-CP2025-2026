// ===== CLOUD BACKUP TO LOCALHOST SYNC =====
// Creates a fresh backup from cloud database and restores it into local MySQL.
//
// Usage:
//   node backup_cloud_to_localhost.cjs
//   node backup_cloud_to_localhost.cjs --yes
//
// Notes:
// - Source config is loaded from .env.production.
// - Target config is loaded from .env.local.
// - Use --yes to skip the restore confirmation prompt.

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..');
const envProductionPath = path.join(projectRoot, '.env.production');
const envLocalPath = path.join(projectRoot, '.env.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return dotenv.parse(fs.readFileSync(filePath));
}

function findLatestBackup() {
  const files = fs.readdirSync(__dirname)
    .filter((fileName) => fileName.toUpperCase().startsWith('FULL_DATABASE_BACKUP') && fileName.endsWith('.sql'))
    .map((fileName) => {
      const fullPath = path.join(__dirname, fileName);
      return {
        fileName,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files.length > 0 ? files[0].fullPath : null;
}

function runNodeScript(scriptPath, args, envOverrides, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n[STEP] ${label}`);

    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...envOverrides
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(scriptPath)} exited with code ${exitCode}`));
      }
    });
  });
}

async function main() {
  const skipConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

  const productionEnv = loadEnvFile(envProductionPath);
  const localEnv = loadEnvFile(envLocalPath);

  if (!productionEnv) {
    throw new Error(`Missing .env.production file at ${envProductionPath}`);
  }

  if (!localEnv) {
    throw new Error(`Missing .env.local file at ${envLocalPath}`);
  }

  console.log('==============================================================');
  console.log(' CLOUD BACKUP TO LOCALHOST SYNC');
  console.log('==============================================================');
  console.log(`Source (cloud): ${productionEnv.DB_HOST}:${productionEnv.DB_PORT} / ${productionEnv.DB_NAME}`);
  console.log(`Target (local): ${localEnv.DB_HOST}:${localEnv.DB_PORT} / ${localEnv.DB_NAME}`);

  await runNodeScript(
    path.join(__dirname, 'backup_full_database.cjs'),
    [],
    productionEnv,
    'Create backup from cloud database'
  );

  const latestBackupFile = findLatestBackup();
  if (!latestBackupFile) {
    throw new Error('Backup finished, but no FULL_DATABASE_BACKUP*.sql file was found.');
  }

  const restoreArgs = [latestBackupFile];
  if (skipConfirm) {
    restoreArgs.push('--yes');
  }

  await runNodeScript(
    path.join(__dirname, 'restore_backup_to_localhost.cjs'),
    restoreArgs,
    localEnv,
    'Restore backup into local MySQL'
  );

  console.log('\n==============================================================');
  console.log(' SYNC COMPLETE');
  console.log('==============================================================');
  console.log('You can now open MySQL Workbench and use your localhost connection.');
}

main().catch((error) => {
  console.error('\nSync failed:', error.message);
  process.exit(1);
});
