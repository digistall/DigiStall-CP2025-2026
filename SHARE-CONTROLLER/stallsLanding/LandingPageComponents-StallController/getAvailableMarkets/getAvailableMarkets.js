import { createConnection } from '../../../config/database.js'

// Get available markets - Uses stored procedure
export const getAvailableMarkets = async (req, res) => {
  let connection
  try {
    connection = await createConnection()

    // Use stored procedure instead of direct SQL
    const [rows] = await connection.execute('CALL sp_getAvailableMarkets()')
    const markets = rows[0] // First result set from stored procedure

    res.json({
      success: true,
      message: 'Available markets retrieved successfully',
      data: markets,
      count: markets.length,
    })
  } catch (error) {
    console.error('❌ Get available markets error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available markets',
      error: error.message,
    })
  } finally {
    if (connection) await connection.end()
  }
}

