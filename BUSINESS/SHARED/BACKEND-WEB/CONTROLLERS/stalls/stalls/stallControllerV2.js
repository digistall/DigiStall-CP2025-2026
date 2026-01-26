// ===== EXAMPLE: STALL CONTROLLER USING NEW ARCHITECTURE =====
// This shows how to migrate existing controllers to use BFF + ORM
// Keep this file as a reference for migrating other controllers

import { WebStallAdapter } from '../../shared/bff/web/index.js';
import { StallService } from '../../shared/services/stallService.js';

/**
 * Get all stalls (Admin Dashboard)
 * Uses Web BFF adapter for proper data formatting
 */
export const getAllStallsV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID not found in authentication token'
      });
    }
    
    // Use Web BFF adapter - returns properly formatted data for web
    const stalls = await WebStallAdapter.getAdminStalls(branchId);
    
    res.json({
      success: true,
      message: 'Stalls retrieved successfully',
      data: stalls,
      count: stalls.length
    });
    
  } catch (error) {
    console.error('❌ Get all stalls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls',
      error: error.message
    });
  }
};

/**
 * Get stall by ID
 */
export const getStallByIdV2 = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stall = await WebStallAdapter.getStallDetails(parseInt(id));
    
    if (!stall) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }
    
    res.json({
      success: true,
      data: stall
    });
    
  } catch (error) {
    console.error('❌ Get stall by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall',
      error: error.message
    });
  }
};

/**
 * Create new stall
 * Uses Service layer for business logic
 */
export const addStallV2 = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const stallData = {
      ...req.body,
      branch_id: req.body.branch_id || req.user?.branchId
    };
    
    const stall = await StallService.createStall(stallData, userId);
    
    res.status(201).json({
      success: true,
      message: 'Stall created successfully',
      data: stall
    });
    
  } catch (error) {
    console.error('❌ Create stall error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create stall'
    });
  }
};

/**
 * Update stall
 */
export const updateStallV2 = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const stall = await StallService.updateStall(parseInt(id), req.body, userId);
    
    res.json({
      success: true,
      message: 'Stall updated successfully',
      data: stall
    });
    
  } catch (error) {
    console.error('❌ Update stall error:', error);
    
    if (error.message === 'Stall not found') {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update stall'
    });
  }
};

/**
 * Delete stall
 */
export const deleteStallV2 = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = await StallService.deleteStall(parseInt(id), userId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Delete stall error:', error);
    
    if (error.message === 'Stall not found') {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }
    
    if (error.message.includes('Cannot delete occupied')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete stall'
    });
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStatsV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    
    const stats = await WebStallAdapter.getDashboardStats(branchId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
};

/**
 * Landing page stalls (public)
 */
export const getLandingStallsV2 = async (req, res) => {
  try {
    const filters = {
      branchId: req.query.branchId ? parseInt(req.query.branchId) : undefined,
      stallType: req.query.type,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };
    
    const stalls = await WebStallAdapter.getLandingPageStalls(filters);
    
    res.json({
      success: true,
      data: stalls,
      count: stalls.length
    });
    
  } catch (error) {
    console.error('❌ Get landing stalls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls'
    });
  }
};

// Export V2 endpoints
export const StallControllerV2 = {
  getAllStallsV2,
  getStallByIdV2,
  addStallV2,
  updateStallV2,
  deleteStallV2,
  getDashboardStatsV2,
  getLandingStallsV2
};

export default StallControllerV2;

