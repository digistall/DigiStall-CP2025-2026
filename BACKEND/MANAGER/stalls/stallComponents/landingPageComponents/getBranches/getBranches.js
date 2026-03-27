import { getPool } from "../../../../../../config/database.js";
import { withRetry, isTimeoutError } from "../../../../../../utils/dbRetry.js";

// Get available branches - NEW endpoint to support branch-based architecture
export const getBranches = async (req, res) => {
  try {
    const pool = getPool();

    // Execute with retry logic for transient failures
    const branches = await withRetry(async () => {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.execute(
          `SELECT DISTINCT branch_name as branch FROM branch WHERE status = 'Active' ORDER BY branch_name`
        );
        return rows;
      } finally {
        connection.release();
      }
    });

    // Format the data to match frontend expectations
    // Frontend expects array of objects with 'branch' property
    const branchList = branches.map((row) => ({
      branch: row.branch,
    }));

    console.log(
      `🏢 Found ${branchList.length} available branches:`,
      branchList.map((b) => b.branch)
    );

    res.json({
      success: true,
      message: "Available branches retrieved successfully",
      data: branchList,
    });
  } catch (error) {
    console.error("❌ Get available branches error:", error);

    // Return 504 for timeout errors, 500 for others
    const statusCode = isTimeoutError(error) ? 504 : 500;
    const message = isTimeoutError(error)
      ? "Database connection timed out. Please try again."
      : "Failed to retrieve available branches";

    res.status(statusCode).json({
      success: false,
      message: message,
      error: error.message,
      code: error.code
    });
  }
};

