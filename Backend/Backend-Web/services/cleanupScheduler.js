import cron from 'node-cron';
import { autoCleanupApplicants } from '../controllers/applicants/applicantsComponents/autoCleanup.js';

class CleanupScheduler {
  constructor() {
    this.job = null;
  }

  /**
   * Start the auto-cleanup scheduler
   * Runs daily at 2:00 AM to clean up rejected applicants older than 30 days
   */
  start() {
    // Schedule to run daily at 2:00 AM
    this.job = cron.schedule('0 2 * * *', async () => {
      console.log('🧹 Starting scheduled auto-cleanup of rejected applicants...');
      
      try {
        // Create a mock request/response object for the cleanup function
        const mockReq = {};
        const mockRes = {
          json: (data) => {
            console.log('✅ Scheduled cleanup completed:', data);
          },
          status: (code) => ({
            json: (data) => {
              console.error('❌ Scheduled cleanup failed:', data);
            }
          })
        };

        await autoCleanupApplicants(mockReq, mockRes);
      } catch (error) {
        console.error('❌ Scheduled cleanup error:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'Asia/Manila' // Adjust timezone as needed
    });

    console.log('🕒 Auto-cleanup scheduler initialized (daily at 2:00 AM)');
    return this;
  }

  /**
   * Start the scheduled job
   */
  enable() {
    if (this.job) {
      this.job.start();
      console.log('✅ Auto-cleanup scheduler enabled');
    }
  }

  /**
   * Stop the scheduled job
   */
  disable() {
    if (this.job) {
      this.job.stop();
      console.log('⏹️ Auto-cleanup scheduler disabled');
    }
  }

  /**
   * Destroy the scheduler
   */
  destroy() {
    if (this.job) {
      this.job.destroy();
      this.job = null;
      console.log('🗑️ Auto-cleanup scheduler destroyed');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isScheduled: !!this.job,
      isRunning: this.job ? this.job.running : false,
      nextExecution: this.job ? this.job.nextDate() : null
    };
  }
}

// Export singleton instance
export const cleanupScheduler = new CleanupScheduler();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  cleanupScheduler.start().enable();
  console.log('🚀 Auto-cleanup scheduler started for production environment');
}

export default cleanupScheduler;