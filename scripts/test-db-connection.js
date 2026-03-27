#!/usr/bin/env node

/**
 * Database Connection Test Utility for DigiStall
 *
 * Tests the database connection using the current .env configuration
 * and provides troubleshooting hints based on error types.
 *
 * Usage:
 *   node scripts/test-db-connection.js
 *   npm run db:test
 */

import { testConnection } from '../config/database.js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

/**
 * Provide troubleshooting hints based on error
 */
function getTroubleshootingHint(error) {
  const errorMsg = error?.message || error || ''
  const errorCode = error?.code || ''

  // Connection timeout errors
  if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED') {
    return `
💡 Troubleshooting Hint:
   Connection timeout - this usually means:

   1. Your IP is not whitelisted in DigitalOcean Trusted Sources
      → Solution: Add your IP at https://cloud.digitalocean.com/databases
      → See docs/DATABASE_SETUP.md for detailed instructions

   2. Network firewall is blocking port ${process.env.DB_PORT || 25060}
      → Solution: Check your firewall settings

   3. Database server is down (less likely with managed databases)
      → Solution: Check DigitalOcean status page`
  }

  // SSL errors
  if (errorMsg.includes('SSL') || errorMsg.includes('ssl') || errorMsg.includes('TLS')) {
    return `
💡 Troubleshooting Hint:
   SSL connection error - check your configuration:

   1. Verify DB_SSL is set correctly in .env
      → For DigitalOcean: DB_SSL=true
      → For local database: DB_SSL=false

   2. Check database configuration in config/database.js
      → SSL should be automatically detected

   3. MySQL Workbench SSL settings:
      → Use SSL: "Required"
      → Leave certificate files empty`
  }

  // Authentication errors
  if (errorCode === 'ER_ACCESS_DENIED_ERROR' || errorMsg.includes('Access denied')) {
    return `
💡 Troubleshooting Hint:
   Authentication failed - check your credentials:

   1. Verify DB_USER and DB_PASSWORD in .env
      → For DigitalOcean: DB_USER=doadmin
      → Check password matches DigitalOcean dashboard

   2. Ensure no extra spaces or quotes in .env file

   3. Check if user has proper permissions on the database`
  }

  // Database not found
  if (errorCode === 'ER_BAD_DB_ERROR' || errorMsg.includes('Unknown database')) {
    return `
💡 Troubleshooting Hint:
   Database not found:

   1. Verify DB_NAME in .env matches actual database name
      → Should be: DB_NAME=naga_stall

   2. Check if database exists in DigitalOcean dashboard

   3. You may need to restore from backup or run migrations`
  }

  // Generic error
  return `
💡 Troubleshooting Hint:
   Connection failed. Check the following:

   1. Verify all database credentials in .env
   2. Run: npm run db:switch (to see current configuration)
   3. Check docs/DATABASE_SETUP.md for detailed setup
   4. Test network connectivity to database server`
}

/**
 * Main test function
 */
async function testDB() {
  console.log('\n🔍 Testing Database Connection...\n')

  // Display current configuration
  const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com')

  console.log('📊 Configuration:')
  console.log(`   Host:     ${process.env.DB_HOST || '(not set)'}`)
  console.log(`   Port:     ${process.env.DB_PORT || '(not set)'}`)
  console.log(`   Database: ${process.env.DB_NAME || '(not set)'}`)
  console.log(`   User:     ${process.env.DB_USER || '(not set)'}`)
  console.log(`   SSL:      ${isCloudDB ? 'Enabled ☁️' : 'Disabled 💻'}`)
  console.log(`   Type:     ${isCloudDB ? 'Cloud Database (DigitalOcean)' : 'Local Database'}`)
  console.log('')

  // Test connection
  try {
    const result = await testConnection()

    if (result.success) {
      console.log('✅ SUCCESS: Database connection established!\n')
      console.log('📈 Connection Details:')
      console.log(`   Host:       ${result.config.host}`)
      console.log(`   User:       ${result.config.user}`)
      console.log(`   Database:   ${result.config.database}`)
      console.log(`   Pool Size:  ${result.config.poolSize} connections`)
      console.log('')

      if (isCloudDB) {
        console.log('💡 Tips:')
        console.log('   - Your IP is properly whitelisted on DigitalOcean')
        console.log('   - You can now use MySQL Workbench to connect')
        console.log('   - See docs/DATABASE_SETUP.md for MySQL Workbench setup')
      } else {
        console.log('💡 Tips:')
        console.log('   - Connected to local MySQL database')
        console.log('   - To switch to cloud: npm run db:cloud')
      }

      console.log('')
      process.exit(0)
    } else {
      throw new Error(result.error || 'Connection test failed')
    }
  } catch (error) {
    console.log('❌ FAILED: Could not connect to database\n')
    console.log('⚠️  Error Details:')
    console.log(`   Code:    ${error.code || 'N/A'}`)
    console.log(`   Message: ${error.message}`)
    console.log('')

    // Provide troubleshooting hints
    console.log(getTroubleshootingHint(error))
    console.log('')

    console.log('📖 For detailed setup instructions, see: docs/DATABASE_SETUP.md')
    console.log('🔧 To check/switch environment: npm run db:switch')
    console.log('')

    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error)
  process.exit(1)
})

// Run the test
testDB()
