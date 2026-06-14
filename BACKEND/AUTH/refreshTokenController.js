import jwt from "jsonwebtoken";
import { createConnection } from "../../config/database.js";
import process from "process";
import crypto from 'crypto';

export const refreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.status(401).json({ success: false, message: "No refresh token found" });
  }
  
  const refreshToken = cookies.jwt;
  let connection;

  try {
    connection = await createConnection();
    
    // 1. Check if token exists in DB
    const [rows] = await connection.query('SELECT * FROM refresh_tokens WHERE token_hash = ?', [refreshToken]);
    
    if (rows.length === 0) {
      // THEFT DETECTED: A refresh token was presented that is NOT in our database!
      // Could be reuse of an invalidated token. Wipe out all sessions for security.
      // We need to decode it just to get the user_id (even if expired, we can still read payload)
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.userId) {
        console.error(`[CRITICAL SECURITY ALERT] Token Reuse Detected for User: ${decoded.userId}. Revoking all sessions.`);
        await connection.query('DELETE FROM refresh_tokens WHERE user_id = ?', [decoded.userId]);
      }
      return res.status(403).json({ success: false, message: "Security violation detected. Please log in again." });
    }

    const tokenRecord = rows[0];
    const userId = tokenRecord.user_id;

    // 2. Verify token signature
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    
    jwt.verify(refreshToken, jwtSecret, async (err, decoded) => {
      if (err) {
        // If expired or invalid, remove from DB and force relogin
        await connection.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [refreshToken]);
        return res.status(403).json({ success: false, message: "Refresh token expired or invalid" });
      }

      // 3. Issue new Access Token (15 minutes)
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, type: decoded.type, email: decoded.email, role: decoded.role },
        jwtSecret,
        { expiresIn: '15m' }
      );

      // 4. Issue new Refresh Token (7 days)
      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, type: decoded.type, email: decoded.email, role: decoded.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // 5. Update DB (Delete old, insert new)
      await connection.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [refreshToken]);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      await connection.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [userId, newRefreshToken, expiresAt]
      );

      // 6. Set new secure HttpOnly cookie
      res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // 7. Send new access token
      res.json({
        success: true,
        message: "Token refreshed successfully",
        token: newAccessToken
      });
    });

  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ success: false, message: "Server error during token refresh" });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
