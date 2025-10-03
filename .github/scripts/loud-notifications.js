// Enhanced Discord notifications - IMPOSSIBLE TO MISS! 🔊

async function sendLoudDiscordNotification(message, isError = false, isStatusChange = false) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  const color = isError ? 15158332 : (isStatusChange ? 16776960 : 3066993); // Red, Yellow, or Green
  const emoji = isError ? '🚨' : (isStatusChange ? '🔔' : '📱');

  // For status changes, make it SUPER LOUD
  if (isStatusChange) {
    // Send 3 rapid notifications
    for (let i = 0; i < 3; i++) {
      const urgentPayload = {
        content: `@everyone 🚨🚨🚨 **URGENT APP STORE UPDATE** 🚨🚨🚨`,
        embeds: [{
          title: `${emoji} LIFECOMPASS APP STATUS CHANGED!`,
          description: `**🔥 IMMEDIATE ACTION REQUIRED! 🔥**\n\n${message}\n\n**CHECK APP STORE CONNECT NOW!**`,
          color: 16776960, // Bright yellow
          timestamp: new Date().toISOString(),
          footer: {
            text: `Alert #${i + 1} - App Store Monitor`
          },
          image: {
            url: 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif' // Alert GIF
          }
        }]
      };

      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(urgentPayload)
        });
        
        // Wait 2 seconds between notifications
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error sending urgent notification:', error);
      }
    }
  } else {
    // Regular notification
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
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

module.exports = { sendLoudDiscordNotification };