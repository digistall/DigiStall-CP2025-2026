import fetch from 'node-fetch';
import { systemLog } from '../../middleware/productionLogger.js';

/**
 * Service to send emails securely from the backend using EmailJS REST API.
 * This ensures that EmailJS public keys and service IDs are not exposed to the client.
 * 
 * @param {Object} params - The template parameters to send to EmailJS
 * @param {string} [templateIdOverride] - Optional template ID if different from default
 * @returns {Promise<boolean>} - True if successful
 */
export const sendEmail = async (params, templateIdOverride = null) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = templateIdOverride || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    systemLog('⚠️ EMAILJS configuration is missing in environment variables. Email will not be sent.', 'warn');
    return false;
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          from_name: process.env.EMAILJS_SENDER_NAME || 'Stall Management System',
          from_email: process.env.EMAILJS_SENDER_EMAIL || 'digistall@unc.edu.ph',
          reply_to: process.env.EMAILJS_SENDER_EMAIL || 'digistall@unc.edu.ph',
          ...params
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      systemLog(`❌ EmailJS Error (${response.status}): ${errorText}`, 'error');
      return false;
    }

    systemLog(`✅ Email successfully sent to ${params.to_email || params.email || 'recipient'}`);
    return true;
  } catch (error) {
    systemLog(`❌ Failed to send email via EmailJS: ${error.message}`, 'error');
    return false;
  }
};
