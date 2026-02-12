const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@8-palms.com';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const APP_URL = process.env.CLIENT_URL || 'https://intel.8-palms.com';

/**
 * Send email notification for new retail property matches
 */
async function sendEmailNotification(user, search, newListings) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping email notification');
    return { success: false, reason: 'SendGrid not configured' };
  }

  try {
    const listingSummary = newListings.slice(0, 5).map(l => {
      const price = l.price >= 1000000
        ? `$${(l.price / 1000000).toFixed(1)}M`
        : `$${(l.price / 1000).toFixed(0)}K`;
      return `• ${l.address}, ${l.city} - ${price}`;
    }).join('\n');

    const moreText = newListings.length > 5
      ? `\n...and ${newListings.length - 5} more properties`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1b1b1b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">8 Palms Retail Search</h1>
        </div>
        <div style="padding: 25px; background: #f8f9fa;">
          <h2 style="color: #1b1b1b; margin-top: 0;">New Properties Found!</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your saved search <strong>"${search.name}"</strong> found <strong>${newListings.length} new ${newListings.length === 1 ? 'property' : 'properties'}</strong>:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <pre style="margin: 0; font-family: Arial; white-space: pre-wrap;">${listingSummary}${moreText}</pre>
          </div>
          <a href="${APP_URL}/retail" style="display: inline-block; background: #27ae60; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">View All Results</a>
        </div>
        <div style="padding: 15px; text-align: center; color: #7f8c8d; font-size: 12px;">
          <p>8 Palms Private Equity Group | Confidential</p>
          <p>To manage your notification preferences, visit your <a href="${APP_URL}/retail">Retail Search</a> page.</p>
        </div>
      </div>
    `;

    const msg = {
      to: user.email,
      from: FROM_EMAIL,
      subject: `${newListings.length} New Retail Properties - ${search.name}`,
      text: `Hi ${user.firstName},\n\nYour saved search "${search.name}" found ${newListings.length} new properties:\n\n${listingSummary}${moreText}\n\nView results at: ${APP_URL}/retail\n\n8 Palms Private Equity Group`,
      html: html
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${user.email} for search "${search.name}"`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS notification for new retail property matches
 */
async function sendSmsNotification(user, search, newListings) {
  if (!twilioClient || !TWILIO_PHONE) {
    console.log('Twilio not configured, skipping SMS notification');
    return { success: false, reason: 'Twilio not configured' };
  }

  if (!user.phone) {
    console.log(`User ${user.email} has no phone number, skipping SMS`);
    return { success: false, reason: 'No phone number' };
  }

  try {
    const count = newListings.length;
    const topListing = newListings[0];
    const price = topListing.price >= 1000000
      ? `$${(topListing.price / 1000000).toFixed(1)}M`
      : `$${(topListing.price / 1000).toFixed(0)}K`;

    const message = `8 Palms: ${count} new retail ${count === 1 ? 'property' : 'properties'} for "${search.name}"! Top: ${topListing.city} - ${price}. View: ${APP_URL}/retail`;

    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: user.phone
    });

    console.log(`SMS sent to ${user.phone} for search "${search.name}"`);
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send notifications for a search with new matches
 */
async function sendNotifications(user, search, newListings) {
  const results = {
    email: null,
    sms: null
  };

  if (search.notifyEmail && user.notificationEmail !== false) {
    results.email = await sendEmailNotification(user, search, newListings);
  }

  if (search.notifySms && user.notificationSms && user.phone) {
    results.sms = await sendSmsNotification(user, search, newListings);
  }

  return results;
}

module.exports = {
  sendEmailNotification,
  sendSmsNotification,
  sendNotifications
};
