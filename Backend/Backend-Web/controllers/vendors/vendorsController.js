import { createConnection } from "../../../config/database.js";

export const vendorsController = {
  async createVendor(req, res) {
    let connection;
    try {
      const {
        first_name,
        last_name,
        middle_name,
        phone,
        email,
        birthdate,
        gender,
        address,
        business_name,
        business_type,
        business_description,
        vendor_identifier,
        collector_id,
      } = req.body;

      connection = await createConnection();
      const [rows] = await connection.execute(
        "CALL createVendor(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          first_name,
          last_name,
          middle_name || null,
          phone || null,
          email || null,
          birthdate || null,
          gender || null,
          address || null,
          business_name || null,
          business_type || null,
          business_description || null,
          vendor_identifier || null,
          collector_id || null,
        ]
      );

      // Stored procedures return the LAST_INSERT_ID rowset as first result
      const result = Array.isArray(rows) && rows[0] ? rows[0] : rows;
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("Error in createVendor:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to create vendor",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getAllVendors(req, res) {
    let connection;
    try {
      connection = await createConnection();
      const [rows] = await connection.execute("CALL getAllVendors()");
      // stored procedure returns resultset as first element
      const vendors = rows[0] || rows;
      res.json({
        success: true,
        data: vendors,
        count: (vendors && vendors.length) || 0,
      });
    } catch (error) {
      console.error("Error in getAllVendors:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch vendors",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getVendorById(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const [rows] = await connection.execute("CALL getVendorById(?)", [id]);
      const vendor = rows[0] && rows[0][0] ? rows[0][0] : null;
      if (!vendor)
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      res.json({ success: true, data: vendor });
    } catch (error) {
      console.error("Error in getVendorById:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch vendor",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getVendorsByCollectorId(req, res) {
    let connection;
    try {
      const { collectorId } = req.params;
      connection = await createConnection();
      const [rows] = await connection.execute(
        "CALL getVendorsByCollectorId(?)",
        [collectorId]
      );
      const vendors = rows[0] || rows;
      res.json({
        success: true,
        data: vendors,
        count: (vendors && vendors.length) || 0,
      });
    } catch (error) {
      console.error("Error in getVendorsByCollectorId:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch vendors by collector",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async updateVendor(req, res) {
    let connection;
    try {
      const { id } = req.params;
      const payload = req.body;
      connection = await createConnection();

      const params = [
        id,
        payload.first_name || null,
        payload.last_name || null,
        payload.middle_name || null,
        payload.phone || null,
        payload.email || null,
        payload.birthdate || null,
        payload.gender || null,
        payload.address || null,
        payload.business_name || null,
        payload.business_type || null,
        payload.business_description || null,
        payload.vendor_identifier || null,
        payload.collector_id || null,
        payload.status || null,
      ];

      const [rows] = await connection.execute(
        "CALL updateVendor(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        params
      );
      const resultRow = rows && rows[0] ? rows[0][0] : rows;
      res.json({ success: true, data: resultRow });
    } catch (error) {
      console.error("Error in updateVendor:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to update vendor",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },

  async deleteVendor(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const [rows] = await connection.execute("CALL deleteVendor(?)", [id]);
      const result = rows && rows[0] ? rows[0][0] : rows;
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error in deleteVendor:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete vendor",
          error: error.message,
        });
    } finally {
      if (connection) await connection.end();
    }
  },
};

export default vendorsController;
