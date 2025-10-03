// Test the 60-alert notification system
// WARNING: This will send 60 Discord notifications in 1 minute!

const https = require('https');

const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1423617313894170716/uvxwigW3K7u6v4V85NkZcRXmx8ssm-Ra8exyJA22G9uxU_K29932wqCBBktM2TQKtGXt";

async function sendNotification(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(DISCORD_WEBHOOK_URL);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 204);
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test60Alerts() {
  console.log('🚨 STARTING 60-ALERT TEST - CHECK YOUR DISCORD! 🚨');
  console.log('⚠️  WARNING: You will receive 60 notifications in the next minute!');
  
  const message = "📱 **Status Changed!**\\n\\n**Version:** 1.0.0\\n**Previous Status:** ⏰ Waiting for Review\\n**New Status:** ✅ Ready for Sale\\n\\nTime: " + new Date().toLocaleString();
  
  // Send 60 notifications - one every second
  for (let i = 0; i < 60; i++) {
    const alertTypes = ['🚨', '🔥', '⚡', '💥', '🚁', '📢', '🆘', '⭐'];
    const randomEmoji = alertTypes[i % alertTypes.length];
    
    const payload = {
      content: `@everyone ${randomEmoji}${randomEmoji}${randomEmoji} **LIFECOMPASS APP STATUS CHANGED (TEST)** ${randomEmoji}${randomEmoji}${randomEmoji}`,
      embeds: [{
        title: `${randomEmoji} TEST ALERT ${i + 1}/60 - APP STATUS CHANGED!`,
        description: `**⚡ WAKE UP! YOUR APP STATUS CHANGED! ⚡**\\n\\n${message}\\n\\n🏃‍♂️ **GO TO APP STORE CONNECT RIGHT NOW!** 🏃‍♂️\\n\\n⏰ Test Alert ${i + 1} of 60 (${60 - i - 1} more coming)`,
        color: i % 2 === 0 ? 16776960 : 15158332,
        timestamp: new Date().toISOString(),
        footer: {
          text: `TEST Alert #${i + 1}/60 - App Store Monitor`
        }
      }]
    };

    try {
      await sendNotification(payload);
      console.log(`🚨 Test alert ${i + 1}/60 sent`);
      
      // Wait 1 second (except for last alert)
      if (i < 59) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error sending alert ${i + 1}:`, error);
    }
  }
  
  console.log('🎯 TEST COMPLETE - 60 notifications sent!');
  console.log('This is what you will get when your app status actually changes!');
}

test60Alerts();