import { createConnection } from "../../../../../../SHARED/CONFIG/database.js";
import { mockBranches } from "../../../../../../SHARED/MOCK/mockData.js";

// Get available branches - NEW endpoint to support branch-based architecture
export const getBranches = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    // Get distinct branch names instead of areas
    const [branches] = await connection.execute(
      `SELECT DISTINCT branch_name as branch FROM branch WHERE status = 'Active' ORDER BY branch_name`
    );

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
    console.log("📦 Using mock data for local development");
    
    // Return mock data for local development (when database is not accessible)
    return res.json({
      success: true,
      message: "Available branches retrieved (MOCK DATA)",
      data: mockBranches,
    });
  } finally {
    if (connection) await connection.end();
  }
};
