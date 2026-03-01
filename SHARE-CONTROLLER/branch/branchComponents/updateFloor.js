// Update Floor Component
import { createConnection } from '../../../config/database.js'

export const updateFloor = async (req, res) => {
  let connection
  try {
    connection = await createConnection()
    
    const { floorId } = req.params
    const { floor_name, name, floor_number, status } = req.body
    
    // Support both 'floor_name' and 'name' from frontend
    const floorName = floor_name || name
    
    console.log('Update Floor Request:', { floorId, floor_name, name, floor_number, status })
    
    if (!floorId) {
      return res.status(400).json({
        success: false,
        message: 'Floor ID is required'
      })
    }
    
    // Call stored procedure
    const [result] = await connection.execute(
      'CALL updateFloor(?, ?, ?, ?)',
      [floorId, floorName || null, floor_number || null, status || null]
    )
    
    // Check stored procedure result
    const spResult = result[0][0]
    
    if (spResult.success === 0) {
      return res.status(404).json({
        success: false,
        message: spResult.message
      })
    }
    
    res.status(200).json({
      success: true,
      message: spResult.message
    })
    
  } catch (error) {
    console.error('Error updating floor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update floor',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

