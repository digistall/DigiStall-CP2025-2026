// Logout (client-side token removal, but we can track logout on server)
export const logout = async (req, res) => {
  try {
    // In a stateless JWT setup, logout is typically handled client-side
    // But we can log the logout event for audit purposes
    const user = req.user;

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

