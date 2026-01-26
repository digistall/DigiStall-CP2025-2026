// ===== EXAMPLE: MOBILE STALL CONTROLLER USING NEW ARCHITECTURE =====
// This shows how mobile controllers use the Mobile BFF adapter
// Mobile gets optimized, compact data compared to web

import { MobileStallAdapter } from '../../shared/bff/mobile/index.js';

/**
 * Get stalls for mobile list view
 * Uses Mobile BFF adapter for compact data
 */
export const getStallsV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID not found'
      });
    }
    
    // Mobile adapter returns compact data
    const stalls = await MobileStallAdapter.getMobileStalls(branchId);
    
    res.json({
      success: true,
      data: stalls,
      count: stalls.length
    });
    
  } catch (error) {
    console.error('❌ Mobile get stalls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls'
    });
  }
};

/**
 * Get stall details for mobile
 */
export const getStallDetailV2 = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stall = await MobileStallAdapter.getStallDetails(parseInt(id));
    
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
    console.error('❌ Mobile get stall detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall'
    });
  }
};

/**
 * Get stalls for inspector app
 * Includes compliance-relevant information
 */
export const getInspectorStallsV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    
    // Inspector adapter includes compliance info
    const stalls = await MobileStallAdapter.getInspectorStalls(branchId);
    
    res.json({
      success: true,
      data: stalls,
      count: stalls.length
    });
    
  } catch (error) {
    console.error('❌ Get inspector stalls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls'
    });
  }
};

/**
 * Get stalls for collector app
 * Includes payment-relevant information
 */
export const getCollectorStallsV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    
    // Collector adapter includes payment info, only occupied stalls
    const stalls = await MobileStallAdapter.getCollectorStalls(branchId);
    
    res.json({
      success: true,
      data: stalls,
      count: stalls.length
    });
    
  } catch (error) {
    console.error('❌ Get collector stalls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls'
    });
  }
};

/**
 * Get stall count for app badge
 */
export const getStallCountV2 = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    const { status } = req.query;
    
    const count = await MobileStallAdapter.getStallCount(branchId, status);
    
    res.json({
      success: true,
      count
    });
    
  } catch (error) {
    console.error('❌ Get stall count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get count'
    });
  }
};

export const MobileStallControllerV2 = {
  getStallsV2,
  getStallDetailV2,
  getInspectorStallsV2,
  getCollectorStallsV2,
  getStallCountV2
};

export default MobileStallControllerV2;
