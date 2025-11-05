import { createConnection } from '../config/database.js';
import nodemailer from 'nodemailer';

/**
 * Email Service for Employee Management
 * Handles sending welcome emails, password reset notifications, and other employee communications
 */

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
        this.baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@nagastallmanagement.com';
        this.fromName = process.env.FROM_NAME || 'Naga Stall Management System';
    }

    /**
     * Create email transporter
     * Configure this based on your email service (Gmail, SendGrid, etc.)
     */
    createTransporter() {
        // For development - Log emails to console
        if (process.env.NODE_ENV === 'development') {
            return {
                sendMail: async (mailOptions) => {
                    console.log('\n=== EMAIL SIMULATION ===');
                    console.log('Email notification sent successfully');
                    console.log('========================\n');
                    return { messageId: 'simulated-' + Date.now() };
                }
            };
        }

        // For production - Configure with real SMTP
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * Get email template from database
     */
    async getEmailTemplate(templateName) {
        let connection;
        try {
            connection = await createConnection();
            const [[template]] = await connection.execute(
                'CALL getEmailTemplate(?)',
                [templateName]
            );

            if (!template) {
                throw new Error(`Email template '${templateName}' not found`);
            }

            return template;
        } catch (error) {
            console.error('Error getting email template:', error);
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }

    /**
     * Replace template variables with actual values
     */
    replaceTemplateVariables(content, variables) {
        let processedContent = content;

        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = variables[key] || '';
            processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
        });

        return processedContent;
    }

    /**
     * Send welcome email to new employee with credentials
     */
    async sendEmployeeWelcomeEmail(employeeData) {
        try {
            const { email, firstName, lastName, username, password, branchName, createdBy } = employeeData;

            // Get email template
            const template = await this.getEmailTemplate('welcome_employee');

            // Prepare template variables
            const variables = {
                firstName,
                lastName,
                username,
                password,
                loginUrl: `${this.baseUrl}/employee/login`,
                branchName: branchName || 'Unknown Branch',
                createdBy: createdBy || 'System Administrator'
            };

            // Process template content
            const htmlContent = this.replaceTemplateVariables(template.html_content, variables);
            const textContent = this.replaceTemplateVariables(template.text_content, variables);
            const subject = this.replaceTemplateVariables(template.subject, variables);

            // Email options
            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            console.log('Welcome email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error;
        }
    }

    /**
     * Send password reset email to employee
     */
    async sendEmployeePasswordResetEmail(resetData) {
        try {
            const { email, firstName, lastName, username, password, resetBy, resetDate } = resetData;

            // Get email template
            const template = await this.getEmailTemplate('password_reset');

            // Prepare template variables
            const variables = {
                firstName,
                lastName,
                username,
                password,
                loginUrl: `${this.baseUrl}/employee/login`,
                resetBy: resetBy || 'System Administrator',
                resetDate: resetDate || new Date().toLocaleString()
            };

            // Process template content
            const htmlContent = this.replaceTemplateVariables(template.html_content, variables);
            const textContent = this.replaceTemplateVariables(template.text_content, variables);
            const subject = this.replaceTemplateVariables(template.subject, variables);

            // Email options
            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            console.log('Password reset email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw error;
        }
    }

    /**
     * Send custom notification email to employee
     */
    async sendEmployeeNotification(notificationData) {
        try {
            const { email, subject, message, employeeName } = notificationData;

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: `[Naga Stall Management] ${subject}`,
                text: `Hello ${employeeName},\n\n${message}\n\nBest regards,\nNaga Stall Management Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                            <h2>Naga Stall Management</h2>
                        </div>
                        <div style="padding: 30px; background: #f9f9f9;">
                            <p>Hello ${employeeName},</p>
                            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Best regards,<br>Naga Stall Management Team</p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('Notification email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending notification email:', error);
            throw error;
        }
    }

    /**
     * Send application status notification email to applicant
     */
    async sendApplicationStatusEmail(applicationData) {
        try {
            const { 
                applicant_email, 
                applicant_name, 
                application_status, 
                stall_id, 
                stall_location, 
                application_id,
                rejection_reason 
            } = applicationData;

            let subject, message, htmlMessage;

            switch (application_status) {
                case 'Approved':
                    subject = 'Application Approved - Naga Stall Management';
                    message = `Dear ${applicant_name},\n\nCongratulations! Your application for Stall ${stall_id} at ${stall_location} has been APPROVED.\n\nApplication ID: ${application_id}\n\nPlease contact our office within 7 days to complete the necessary paperwork and payment.\n\nThank you for choosing Naga Stall Management.\n\nBest regards,\nNaga Stall Management Team`;
                    htmlMessage = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 20px; text-align: center;">
                                <h2>Application Approved!</h2>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9;">
                                <p>Dear ${applicant_name},</p>
                                <div style="background: #d4edda; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
                                    <strong>Congratulations!</strong> Your application has been approved.
                                </div>
                                <p><strong>Application Details:</strong></p>
                                <ul>
                                    <li>Application ID: ${application_id}</li>
                                    <li>Stall ID: ${stall_id}</li>
                                    <li>Location: ${stall_location}</li>
                                    <li>Status: Approved</li>
                                </ul>
                                <p>Please contact our office within 7 days to complete the necessary paperwork and payment.</p>
                                <p>Best regards,<br>Naga Stall Management Team</p>
                            </div>
                        </div>
                    `;
                    break;

                case 'Rejected':
                    subject = 'Application Status Update - Naga Stall Management';
                    message = `Dear ${applicant_name},\n\nWe regret to inform you that your application for Stall ${stall_id} at ${stall_location} has been rejected.\n\nApplication ID: ${application_id}\n${rejection_reason ? `Reason: ${rejection_reason}\n` : ''}\nYou may reapply for other available stalls on our website.\n\nThank you for your interest in Naga Stall Management.\n\nBest regards,\nNaga Stall Management Team`;
                    htmlMessage = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 20px; text-align: center;">
                                <h2>Application Status Update</h2>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9;">
                                <p>Dear ${applicant_name},</p>
                                <div style="background: #f8d7da; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
                                    We regret to inform you that your application has been rejected.
                                </div>
                                <p><strong>Application Details:</strong></p>
                                <ul>
                                    <li>Application ID: ${application_id}</li>
                                    <li>Stall ID: ${stall_id}</li>
                                    <li>Location: ${stall_location}</li>
                                    <li>Status: Rejected</li>
                                    ${rejection_reason ? `<li>Reason: ${rejection_reason}</li>` : ''}
                                </ul>
                                <p>You may reapply for other available stalls on our website.</p>
                                <p>Best regards,<br>Naga Stall Management Team</p>
                            </div>
                        </div>
                    `;
                    break;

                case 'Under Review':
                    subject = 'Application Under Review - Naga Stall Management';
                    message = `Dear ${applicant_name},\n\nYour application for Stall ${stall_id} at ${stall_location} is now under review.\n\nApplication ID: ${application_id}\n\nWe will notify you once the review is complete. This typically takes 3-5 business days.\n\nThank you for your patience.\n\nBest regards,\nNaga Stall Management Team`;
                    htmlMessage = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 20px; text-align: center;">
                                <h2>Application Under Review</h2>
                            </div>
                            <div style="padding: 30px; background: #f9f9f9;">
                                <p>Dear ${applicant_name},</p>
                                <div style="background: #d1ecf1; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
                                    Your application is now under review.
                                </div>
                                <p><strong>Application Details:</strong></p>
                                <ul>
                                    <li>Application ID: ${application_id}</li>
                                    <li>Stall ID: ${stall_id}</li>
                                    <li>Location: ${stall_location}</li>
                                    <li>Status: Under Review</li>
                                </ul>
                                <p>We will notify you once the review is complete. This typically takes 3-5 business days.</p>
                                <p>Best regards,<br>Naga Stall Management Team</p>
                            </div>
                        </div>
                    `;
                    break;

                default:
                    return { success: false, message: 'Invalid application status for email' };
            }

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: applicant_email,
                subject: subject,
                text: message,
                html: htmlMessage
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('Application status email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                recipient: applicant_email
            };

        } catch (error) {
            console.error('Error sending application status email:', error);
            throw error;
        }
    }

    /**
     * Send application confirmation email to applicant
     */
    async sendApplicationConfirmationEmail(applicationData) {
        try {
            const { 
                applicant_email, 
                applicant_name, 
                stall_id, 
                stall_location, 
                application_id,
                application_date 
            } = applicationData;

            const subject = 'Application Received - Naga Stall Management';
            const message = `Dear ${applicant_name},\n\nThank you for submitting your application for Stall ${stall_id} at ${stall_location}.\n\nApplication ID: ${application_id}\nSubmission Date: ${application_date}\n\nYour application has been received and will be reviewed within 3-5 business days. We will notify you of the decision via email.\n\nBest regards,\nNaga Stall Management Team`;
            
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h2>Application Received</h2>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9;">
                        <p>Dear ${applicant_name},</p>
                        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                            Thank you for submitting your application!
                        </div>
                        <p><strong>Application Details:</strong></p>
                        <ul>
                            <li>Application ID: ${application_id}</li>
                            <li>Stall ID: ${stall_id}</li>
                            <li>Location: ${stall_location}</li>
                            <li>Submission Date: ${application_date}</li>
                            <li>Status: Pending Review</li>
                        </ul>
                        <p>Your application will be reviewed within 3-5 business days. We will notify you of the decision via email.</p>
                        <p>Best regards,<br>Naga Stall Management Team</p>
                    </div>
                </div>
            `;

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: applicant_email,
                subject: subject,
                text: message,
                html: htmlMessage
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log('Application confirmation email sent successfully');
            return {
                success: true,
                messageId: result.messageId,
                recipient: applicant_email
            };

        } catch (error) {
            console.error('Error sending application confirmation email:', error);
            throw error;
        }
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        try {
            const testEmail = {
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                username: 'EMP1234',
                password: 'TestPass123',
                branchName: 'Test Branch',
                createdBy: 'Test Manager'
            };

            // This will log to console in development mode
            await this.sendEmployeeWelcomeEmail(testEmail);

            return {
                success: true,
                message: 'Email configuration test completed successfully'
            };

        } catch (error) {
            console.error('Email configuration test failed:', error);
            return {
                success: false,
                message: 'Email configuration test failed',
                error: error.message
            };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;