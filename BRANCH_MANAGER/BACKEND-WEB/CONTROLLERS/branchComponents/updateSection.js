// Update Section Component
import { createConnection } from '../../../../SHARED/CONFIG/database.js'

export const updateSection = async (req, res) => {
  let connection
  try {
    connection = await createConnection()
    
    const { sectionId } = req.params
    const { section_name, name, status } = req.body
    
    // Support both 'section_name' and 'name' from frontend
    const sectionName = section_name || name
    
    console.log('Update Section Request:', { sectionId, section_name, name, status })
    
    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Section ID is required'
      })
    }
    
    // Call stored procedure
    const [result] = await connection.execute(
      'CALL updateSection(?, ?, ?)',
      [sectionId, sectionName || null, status || null]
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
    console.error('Error updating section:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update section',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}
