const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const ISSUER_ID = process.env.APP_STORE_CONNECT_ISSUER_ID;
const KEY_ID = process.env.APP_STORE_CONNECT_KEY_ID;
const PRIVATE_KEY = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const APP_ID = process.env.APP_ID;

// File to store last known status
const STATUS_FILE = path.join(__dirname, 'last-status.json');

// Generate JWT for App Store Connect API
function generateJWT() {
  const now = Math.round(new Date().getTime() / 1000);
  const nowPlus20 = now + 1200; // 20 minutes

  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: nowPlus20,
    aud: 'appstoreconnect-v1'
  };

  const header = {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT'
  };

  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'ES256', header });
}

// Get app versions from App Store Connect
async function getAppVersions() {
  const token = generateJWT();
  
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=READY_FOR_SALE,PENDING_APPLE_RELEASE,IN_REVIEW,WAITING_FOR_REVIEW,PREPARE_FOR_SUBMISSION,REJECTED&sort=-createdDate&limit=5`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`App Store Connect API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Send Discord notification
async function sendDiscordNotification(message, isError = false) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  const color = isError ? 15158332 : 3066993; // Red for error, green for success
  const emoji = isError ? '❌' : '🔔';

  const payload = {
    embeds: [{
      title: `${emoji} LifeCompass App Store Status Update`,
      description: message,
      color: color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'App Store Connect Monitor'
      }
    }]
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.statusText);
    } else {
      console.log('Discord notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

// Load last known status
function loadLastStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading last status:', error);
  }
  return null;
}

// Save current status
function saveCurrentStatus(status) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error saving status:', error);
  }
}

// Format status for display
function formatStatus(appStoreState) {
  const statusMap = {
    'READY_FOR_SALE': '✅ Ready for Sale',
    'PENDING_APPLE_RELEASE': '⏳ Pending Apple Release',
    'IN_REVIEW': '👀 In Review',
    'WAITING_FOR_REVIEW': '⏰ Waiting for Review',
    'PREPARE_FOR_SUBMISSION': '📝 Prepare for Submission',
    'REJECTED': '❌ Rejected'
  };
  
  return statusMap[appStoreState] || appStoreState;
}

// Main monitoring function
async function monitorAppStore() {
  try {
    console.log('Checking App Store Connect status...');
    
    const data = await getAppVersions();
    
    if (!data.data || data.data.length === 0) {
      console.log('No app versions found');
      return;
    }

    // Get the most recent version
    const latestVersion = data.data[0];
    const currentStatus = {
      versionString: latestVersion.attributes.versionString,
      appStoreState: latestVersion.attributes.appStoreState,
      createdDate: latestVersion.attributes.createdDate,
      timestamp: new Date().toISOString()
    };

    console.log(`Current status: ${formatStatus(currentStatus.appStoreState)} (v${currentStatus.versionString})`);

    // Load last known status
    const lastStatus = loadLastStatus();

    // Check if status has changed
    if (lastStatus && lastStatus.appStoreState !== currentStatus.appStoreState) {
      const message = `📱 **Status Changed!**\n\n` +
                     `**Version:** ${currentStatus.versionString}\n` +
                     `**Previous Status:** ${formatStatus(lastStatus.appStoreState)}\n` +
                     `**New Status:** ${formatStatus(currentStatus.appStoreState)}\n\n` +
                     `Time: ${new Date().toLocaleString()}`;

      console.log('Status changed! Sending notification...');
      await sendDiscordNotification(message);
      
      // If rejected, send additional info
      if (currentStatus.appStoreState === 'REJECTED') {
        setTimeout(async () => {
          await sendDiscordNotification(
            '🚨 **Action Required:** Your app was rejected. Check App Store Connect for rejection details and resubmit ASAP!',
            true
          );
        }, 2000);
      }
    } else if (!lastStatus) {
      // First run - just log current status
      const message = `🔍 **Initial Status Check**\n\n` +
                     `**Version:** ${currentStatus.versionString}\n` +
                     `**Current Status:** ${formatStatus(currentStatus.appStoreState)}\n\n` +
                     `Monitoring started at ${new Date().toLocaleString()}`;
      
      await sendDiscordNotification(message);
    }

    // Save current status
    saveCurrentStatus(currentStatus);

  } catch (error) {
    console.error('Error monitoring App Store:', error);
    await sendDiscordNotification(`🚨 **Monitor Error:** ${error.message}`, true);
  }
}

// Run the monitor
monitorAppStore();