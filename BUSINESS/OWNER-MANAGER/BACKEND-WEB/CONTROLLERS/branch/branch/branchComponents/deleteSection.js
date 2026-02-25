// Delete Section Component
import { createConnection } from '../../../config/database.js'

export const deleteSection = async (req, res) => {
  let connection
  try {
    connection = await createConnection()
    
    const { sectionId } = req.params
    
    console.log('Delete Section Request:', { sectionId })
    
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Section ID is required'
      })
    }
    
    // Call stored procedure
    const [result] = await connection.execute(
      'CALL deleteSection(?)',
      [sectionId]
    )
    
    // Check stored procedure result
    const spResult = result[0][0]
    console.log('Delete Section SP Result:', spResult)
    
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
    console.error('Error deleting section:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

