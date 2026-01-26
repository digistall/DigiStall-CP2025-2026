// Delete Floor Component
import { createConnection } from '../../../../SHARED/CONFIG/database.js'

export const deleteFloor = async (req, res) => {
  let connection
  try {
    connection = await createConnection()
    
    const { floorId } = req.params
    
    console.log('Delete Floor Request:', { floorId })
    
    if (!floorId) {
      return res.status(400).json({
        success: false,
        message: 'Floor ID is required'
      })
    }
    
    // Call stored procedure
    const [result] = await connection.execute(
      'CALL deleteFloor(?)',
      [floorId]
    )
    
    // Check stored procedure result
    const spResult = result[0][0]
    console.log('Delete Floor SP Result:', spResult)
    
    if (spResult.success === 0) {
      return res.status(400).json({
        success: false,
        message: spResult.message
      })
    }
    
    res.status(200).json({
      success: true,
      message: spResult.message
    })
    
  } catch (error) {
    console.error('Error deleting floor:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete floor',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}
