import mysql from 'mysql2/promise'

async function testDatabaseConnection() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall',
  }

  try {
    console.log('🔄 Attempting to connect to database...')
    console.log('📊 Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
    })

    const connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connection successful!')

    // Test with a simple query
    const [rows] = await connection.execute('SELECT 1 as test')
    console.log('✅ Query test successful:', rows)

    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', ['naga_stall'])
    console.log('✅ Database check:', databases.length > 0 ? 'naga_stall exists' : 'Database not found')

    // Check tables
    const [tables] = await connection.execute('SHOW TABLES')
    console.log(`✅ Tables found: ${tables.length}`)
    tables.forEach((table) => {
      const tableName = table[Object.keys(table)[0]]
      console.log(`   - ${tableName}`)
    })

    await connection.end()
    console.log('✅ Connection closed successfully')
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Error code:', error.code)
    process.exit(1)
  }
}

testDatabaseConnection()
