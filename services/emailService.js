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
        this.mobileAppDownloadUrl = 'https://expo.dev/artifacts/eas/beiHk62bNL1fKDUFWTPEBu.apk';
    }

    /**
     * Add mobile app download link to email content
     */
    addMobileAppLink(content, isHtml = false) {
        if (isHtml) {
            const mobileAppSection = `
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <h3 style="color: #2c3e50; margin-top: 0;">📱 Download DigiStall Mobile App</h3>
                    <p style="color: #555; margin: 10px 0;">Access your account on the go with our mobile application!</p>
                    <a href="${this.mobileAppDownloadUrl}" 
                       style="display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold;">
                        Download Android APK
                    </a>
                    <p style="color: #777; font-size: 12px; margin-top: 15px;">
                        <strong>Note:</strong> You may need to enable "Install from unknown sources" in your Android device settings.
                    </p>
                </div>
            `;
            return content + mobileAppSection;
        } else {
            const mobileAppSection = `

────────────────────────────────────────────────

📱 DOWNLOAD DIGISTALL MOBILE APP

Access your account on the go with our mobile application!

Download Android APK:
${this.mobileAppDownloadUrl}

Note: You may need to enable "Install from unknown sources" in your Android device settings.

────────────────────────────────────────────────
`;
            return content + mobileAppSection;
        }
    }

    /**
     * Create email transporter
     * Configure this based on your email service (Gmail, SendGrid, etc.)
     */
    createTransporter() {
        // For development - Log emails to console
        // Also use this mode if SMTP credentials are not configured
        if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('📧 Email service in DEVELOPMENT MODE - emails will be logged to console');
            return {
                sendMail: async (mailOptions) => {
                    console.log('\n=== EMAIL SIMULATION ===');
                    console.log('To:', mailOptions.to);
                    console.log('Subject:', mailOptions.subject);
                    console.log('Content:', mailOptions.text);
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
            const htmlContent = this.addMobileAppLink(this.replaceTemplateVariables(template.html_content, variables), true);
            const textContent = this.addMobileAppLink(this.replaceTemplateVariables(template.text_content, variables), false);
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
            const htmlContent = this.addMobileAppLink(this.replaceTemplateVariables(template.html_content, variables), true);
            const textContent = this.addMobileAppLink(this.replaceTemplateVariables(template.text_content, variables), false);
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

            const textContent = `Hello ${employeeName},\n\n${message}\n\nBest regards,\nNaga Stall Management Team`;
            const htmlContent = `
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
            `;

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: `[Naga Stall Management] ${subject}`,
                text: this.addMobileAppLink(textContent, false),
                html: this.addMobileAppLink(htmlContent, true)
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
                text: this.addMobileAppLink(message, false),
                html: this.addMobileAppLink(htmlMessage, true)
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
                text: this.addMobileAppLink(message, false),
                html: this.addMobileAppLink(htmlMessage, true)
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
     * Send welcome email to stallholder with auto-generated credentials
     * Used when importing stallholders via Excel
     */
    async sendStallholderWelcomeEmail(stallholderData) {
        try {
            const { 
                email, 
                stallholderName, 
                username, 
                password, 
                stallNo, 
                branchName,
                businessName
            } = stallholderData;

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: 'Welcome to Naga Stall Management - Your Account Has Been Created',
                text: `Dear ${stallholderName},

Welcome to Naga Stall Management System!

Your stallholder account has been created automatically. You can now access the mobile app using the following credentials:

=== YOUR LOGIN CREDENTIALS ===
Username: ${username}
Password: ${password}

=== STALL DETAILS ===
Stall Number: ${stallNo}
${businessName ? `Business Name: ${businessName}` : ''}
${branchName ? `Branch: ${branchName}` : ''}

IMPORTANT: 
- Please change your password after your first login for security purposes.
- Download the Naga Stall Management mobile app to access your account.
- Keep your credentials safe and do not share them with anyone.

📱 DOWNLOAD MOBILE APP:
${this.mobileAppDownloadUrl}

If you have any questions, please contact your branch manager.

Best regards,
Naga Stall Management Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #002181 0%, #003399 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 24px;">🏪 Naga Stall Management</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to your new account!</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="font-size: 16px; color: #333;">Dear <strong>${stallholderName}</strong>,</p>
                            
                            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32; font-size: 16px;">🎉 Your account has been created!</p>
                                <p style="margin: 0; color: #555;">You can now access the mobile app using the credentials below.</p>
                            </div>
                            
                            <div style="background: #f8f9fa; border: 2px dashed #002181; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 15px 0; font-weight: bold; color: #002181; font-size: 18px;">🔐 Your Login Credentials</p>
                                <div style="background: white; padding: 15px; border-radius: 6px; display: inline-block;">
                                    <p style="margin: 0 0 10px 0;"><strong>Username:</strong> <span style="color: #002181; font-family: monospace; font-size: 16px;">${username}</span></p>
                                    <p style="margin: 0;"><strong>Password:</strong> <span style="color: #002181; font-family: monospace; font-size: 16px;">${password}</span></p>
                                </div>
                            </div>
                            
                            <div style="background: #f1f3f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">📍 Stall Details</p>
                                <ul style="margin: 0; padding-left: 20px; color: #555;">
                                    <li><strong>Stall Number:</strong> ${stallNo}</li>
                                    ${businessName ? `<li><strong>Business:</strong> ${businessName}</li>` : ''}
                                    ${branchName ? `<li><strong>Branch:</strong> ${branchName}</li>` : ''}
                                </ul>
                            </div>
                            
                            <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; margin: 20px 0; border-radius: 8px;">
                                <p style="margin: 0; color: #e65100; font-weight: bold;">⚠️ Important Security Notice</p>
                                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #bf360c;">
                                    <li>Please change your password after your first login</li>
                                    <li>Keep your credentials safe and confidential</li>
                                    <li>Download the mobile app to access your account</li>
                                </ul>
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #002181 0%, #003399 100%); padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 15px 0; color: white; font-weight: bold; font-size: 16px;">📱 Download DigiStall Mobile App</p>
                                <a href="${this.mobileAppDownloadUrl}" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px;">Download Now</a>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">Available for Android devices</p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">If you have any questions, please contact your branch manager.</p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            
                            <p style="color: #888; font-size: 12px; text-align: center;">
                                Best regards,<br>
                                <strong>Naga Stall Management Team</strong>
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log(`📧 Stallholder welcome email sent to ${email}`);
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending stallholder welcome email:', error);
            throw error;
        }
    }

    /**
     * Send welcome email to stallholder with auto-generated credentials
     * Used when importing stallholders via Excel
     */
    async sendStallholderWelcomeEmail(stallholderData) {
        try {
            const { 
                email, 
                stallholderName, 
                username, 
                password, 
                stallNo, 
                branchName,
                businessName
            } = stallholderData;

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: 'Welcome to Naga Stall Management - Your Account Has Been Created',
                text: `Dear ${stallholderName},

Welcome to Naga Stall Management System!

Your stallholder account has been created automatically. You can now access the mobile app using the following credentials:

=== YOUR LOGIN CREDENTIALS ===
Username: ${username}
Password: ${password}

=== STALL DETAILS ===
Stall Number: ${stallNo}
${businessName ? `Business Name: ${businessName}` : ''}
${branchName ? `Branch: ${branchName}` : ''}

IMPORTANT: 
- Please change your password after your first login for security purposes.
- Download the Naga Stall Management mobile app to access your account.
- Keep your credentials safe and do not share them with anyone.

If you have any questions, please contact your branch manager.

Best regards,
Naga Stall Management Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #002181 0%, #003399 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; font-size: 24px;">🏪 Naga Stall Management</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to your new account!</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                            <p style="font-size: 16px; color: #333;">Dear <strong>${stallholderName}</strong>,</p>
                            
                            <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32; font-size: 16px;">🎉 Your account has been created!</p>
                                <p style="margin: 0; color: #555;">You can now access the mobile app using the credentials below.</p>
                            </div>
                            
                            <div style="background: #f8f9fa; border: 2px dashed #002181; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 15px 0; font-weight: bold; color: #002181; font-size: 18px;">🔐 Your Login Credentials</p>
                                <div style="background: white; padding: 15px; border-radius: 6px; display: inline-block;">
                                    <p style="margin: 0 0 10px 0;"><strong>Username:</strong> <span style="color: #002181; font-family: monospace; font-size: 16px;">${username}</span></p>
                                    <p style="margin: 0;"><strong>Password:</strong> <span style="color: #002181; font-family: monospace; font-size: 16px;">${password}</span></p>
                                </div>
                            </div>
                            
                            <div style="background: #f1f3f5; padding: 15px; margin: 20px 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">📍 Stall Details</p>
                                <ul style="margin: 0; padding-left: 20px; color: #555;">
                                    <li><strong>Stall Number:</strong> ${stallNo}</li>
                                    ${businessName ? `<li><strong>Business:</strong> ${businessName}</li>` : ''}
                                    ${branchName ? `<li><strong>Branch:</strong> ${branchName}</li>` : ''}
                                </ul>
                            </div>
                            
                            <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; margin: 20px 0; border-radius: 8px;">
                                <p style="margin: 0; color: #e65100; font-weight: bold;">⚠️ Important Security Notice</p>
                                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #bf360c;">
                                    <li>Please change your password after your first login</li>
                                    <li>Keep your credentials safe and confidential</li>
                                    <li>Download the mobile app to access your account</li>
                                </ul>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">If you have any questions, please contact your branch manager.</p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                            
                            <p style="color: #888; font-size: 12px; text-align: center;">
                                Best regards,<br>
                                <strong>Naga Stall Management Team</strong>
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log(`📧 Stallholder welcome email sent to ${email}`);
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending stallholder welcome email:', error);
            throw error;
        }
    }

    /**
     * Send welcome email to new branch manager with credentials
     */
    async sendManagerWelcomeEmail(managerData) {
        try {
            const { email, firstName, lastName, username, password, branchName, managerId } = managerData;

            const textContent = `
Hello ${firstName} ${lastName},

Welcome to Naga Stall Management System!

You have been assigned as the Branch Manager for: ${branchName}

Your login credentials are:
Username (Email): ${username}
Password: ${password}

Login URL: ${this.baseUrl}/manager/login

Please keep these credentials secure and change your password after first login.

For any assistance, please contact the System Administrator.

Best regards,
Naga Stall Management Team
                `.trim();

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 5px 5px; }
        .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #1976d2; }
        .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Welcome to Naga Stall Management</h1>
        </div>
        <div class="content">
            <h2>Hello ${firstName} ${lastName},</h2>
            <p>Welcome to the Naga Stall Management System!</p>
            <p>You have been assigned as the <strong>Branch Manager</strong> for:</p>
            <h3 style="color: #1976d2;">${branchName}</h3>
            
            <div class="credentials">
                <h3>📧 Your Login Credentials</h3>
                <p><strong>Username (Email):</strong> ${username}</p>
                <p><strong>Password:</strong> <code style="background: #f5f5f5; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${password}</code></p>
                <p><strong>Manager ID:</strong> #${managerId}</p>
            </div>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                Please keep these credentials secure and change your password after your first login for security purposes.
            </div>

            <div style="text-align: center;">
                <a href="${this.baseUrl}/manager/login" class="button">Login to Your Account</a>
            </div>

            <div class="footer">
                <p>For assistance, please contact your System Administrator.</p>
                <p><strong>Naga Stall Management Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
                `.trim();

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: email,
                subject: '[Naga Stall Management] Welcome - Branch Manager Access',
                text: this.addMobileAppLink(textContent, false),
                html: this.addMobileAppLink(htmlContent, true)
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Branch Manager welcome email sent to: ${email}`);
            return {
                success: true,
                messageId: result.messageId,
                recipient: email
            };

        } catch (error) {
            console.error('Error sending manager welcome email:', error);
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

