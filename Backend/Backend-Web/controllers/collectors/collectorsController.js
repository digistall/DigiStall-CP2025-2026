import { createConnection } from "../../../config/database.js";

export const collectorsController = {
  async createCollector(req, res) {
    let connection;
    try {
      const { first_name, last_name, email, contact_number, branch_id } =
        req.body;
      connection = await createConnection();
      const [rows] = await connection.execute(
        "CALL createCollector(?,?,?,?,?)",
        [
          first_name,
          last_name,
          email || null,
          contact_number || null,
          branch_id || null,
        ]
      );
      const result = Array.isArray(rows) && rows[0] ? rows[0] : rows;
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("Error in createCollector:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to create collector",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getAllCollectors(req, res) {
    let connection;
    try {
      connection = await createConnection();
      const [rows] = await connection.execute("CALL getAllCollectors()");
      const collectors = rows[0] || rows;
      res.json({
        success: true,
        data: collectors,
        count: (collectors && collectors.length) || 0,
      });
    } catch (error) {
      console.error("Error in getAllCollectors:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch collectors",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getCollectorById(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const [rows] = await connection.execute("CALL getCollectorById(?)", [id]);
      const collector = rows[0] && rows[0][0] ? rows[0][0] : null;
      if (!collector)
        return res
          .status(404)
          .json({ success: false, message: "Collector not found" });
      res.json({ success: true, data: collector });
    } catch (error) {
      console.error("Error in getCollectorById:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch collector",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async updateCollector(req, res) {
    let connection;
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        contact_number,
        branch_id,
        status,
      } = req.body;
      connection = await createConnection();
      const [rows] = await connection.execute(
        "CALL updateCollector(?,?,?,?,?,?,?)",
        [
          id,
          first_name || null,
          last_name || null,
          email || null,
          contact_number || null,
          branch_id || null,
          status || null,
        ]
      );
      const result = rows && rows[0] ? rows[0][0] : rows;
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error in updateCollector:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to update collector",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async deleteCollector(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const [rows] = await connection.execute("CALL deleteCollector(?)", [id]);
      const result = rows && rows[0] ? rows[0][0] : rows;
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error in deleteCollector:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete collector",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },
};

export default collectorsController;
