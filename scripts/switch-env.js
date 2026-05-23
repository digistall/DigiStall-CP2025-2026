#!/usr/bin/env node

/**
 * Environment Switcher for DigiStall Database Configuration
 *
 * Usage:
 *   node scripts/switch-env.js [local|cloud|production]
 *   npm run db:local   // Switch to local database
 *   npm run db:cloud   // Switch to cloud database
 *   npm run db:switch  // Show current configuration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// Environment file paths
const ENV_FILES = {
  current: path.join(projectRoot, '.env'),
  local: path.join(projectRoot, '.env.local'),
  cloud: path.join(projectRoot, '.env.production'),
  production: path.join(projectRoot, '.env.production')
}

// Parse command line argument
const arg = process.argv[2]?.toLowerCase()

/**
 * Read and parse an environment file
 */
function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    const config = {}

    content.split('\n').forEach(line => {
      line = line.trim()
      if (!line || line.startsWith('#')) return

      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        config[key] = value
      }
    })

    return config
  } catch (error) {
    return null
  }
}

/**
 * Display current environment configuration
 */
function showCurrentConfig() {
  const config = readEnvFile(ENV_FILES.current)

  if (!config) {
    console.log('❌ No .env file found!')
    console.log('💡 Run: npm run db:cloud  or  npm run db:local')
    return
  }

  console.log('\n📊 Current Database Configuration:\n')
  console.log(`   DB_HOST:     ${config.DB_HOST || '(not set)'}`)
  console.log(`   DB_PORT:     ${config.DB_PORT || '(not set)'}`)
  console.log(`   DB_NAME:     ${config.DB_NAME || '(not set)'}`)
  console.log(`   DB_USER:     ${config.DB_USER || '(not set)'}`)
  console.log(`   DB_SSL:      ${config.DB_SSL || '(not set)'}`)
  console.log(`   NODE_ENV:    ${config.NODE_ENV || '(not set)'}`)

  // Determine which environment is active
  const isCloud = config.DB_SSL === 'true' || config.DB_HOST?.includes('ondigitalocean.com')
  const isLocal = config.DB_HOST === 'localhost' || config.DB_HOST === '127.0.0.1'

  console.log('\n🎯 Active Environment:')
  if (isCloud) {
    console.log('   ☁️  DigitalOcean Cloud Database')
  } else if (isLocal) {
    console.log('   💻 Local Database')
  } else {
    console.log('   ❓ Unknown configuration')
  }

  console.log('\n💡 To switch environments:')
  console.log('   npm run db:local   - Switch to local database')
  console.log('   npm run db:cloud   - Switch to cloud database')
  console.log('')
}

/**
 * Backup current .env file
 */
function backupCurrentEnv() {
  if (fs.existsSync(ENV_FILES.current)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const backupPath = path.join(projectRoot, `.env.backup-${timestamp}`)

    // Only create backup if one doesn't exist for today
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(ENV_FILES.current, backupPath)
      console.log(`📦 Backed up current .env to: .env.backup-${timestamp}`)
    }
  }
}

/**
 * Switch to specified environment
 */
function switchEnvironment(envType) {
  const sourceFile = ENV_FILES[envType]

  // Validate source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Error: ${path.basename(sourceFile)} not found!`)
    console.log(`   Expected location: ${sourceFile}`)
    console.log('\n💡 Available environment files:')

    Object.entries(ENV_FILES).forEach(([key, file]) => {
      if (key !== 'current' && fs.existsSync(file)) {
        console.log(`   ✅ ${path.basename(file)} (use: npm run db:${key})`)
      }
    })

    process.exit(1)
  }

  // Backup current .env
  backupCurrentEnv()

  // Copy source to .env
  fs.copyFileSync(sourceFile, ENV_FILES.current)

  // Read and display new config
  const newConfig = readEnvFile(ENV_FILES.current)

  console.log('\n✅ Environment switched successfully!\n')

  if (envType === 'local') {
    console.log('   💻 LOCAL Database Configuration:')
    console.log(`      Host: ${newConfig.DB_HOST}:${newConfig.DB_PORT}`)
    console.log(`      Database: ${newConfig.DB_NAME}`)
    console.log(`      SSL: ${newConfig.DB_SSL}`)
    console.log('\n   ⚠️  Make sure your local MySQL server is running!')
  } else {
    console.log('   ☁️  CLOUD Database Configuration (DigitalOcean):')
    console.log(`      Host: ${newConfig.DB_HOST}`)
    console.log(`      Port: ${newConfig.DB_PORT}`)
    console.log(`      Database: ${newConfig.DB_NAME}`)
    console.log(`      SSL: ${newConfig.DB_SSL}`)
    console.log('\n   ⚠️  Make sure your IP is whitelisted in DigitalOcean Trusted Sources!')
    console.log('   📖 See: docs/DATABASE_SETUP.md for setup instructions')
  }

  console.log('\n💡 Test your connection:')
  console.log('   npm run db:test')
  console.log('')
}

/**
 * Display usage information
 */
function showUsage() {
  console.log('\n🔧 DigiStall Database Environment Switcher\n')
  console.log('Usage:')
  console.log('  node scripts/switch-env.js [local|cloud|production]')
  console.log('')
  console.log('Examples:')
  console.log('  npm run db:local     - Switch to local database (localhost)')
  console.log('  npm run db:cloud     - Switch to cloud database (DigitalOcean)')
  console.log('  npm run db:switch    - Show current configuration')
  console.log('')
  console.log('Available environments:')
  console.log('  local      - Local MySQL database (localhost:3301)')
  console.log('  cloud      - DigitalOcean managed database (production)')
  console.log('  production - Same as cloud (DigitalOcean)')
  console.log('')
}

// Main execution
if (!arg) {
  showCurrentConfig()
} else if (arg === 'help' || arg === '--help' || arg === '-h') {
  showUsage()
} else if (ENV_FILES[arg]) {
  switchEnvironment(arg)
} else {
  console.log(`❌ Unknown environment: ${arg}`)
  console.log('   Valid options: local, cloud, production')
  console.log('   Run without arguments to see current configuration')
  process.exit(1)
}
