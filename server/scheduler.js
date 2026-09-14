import cron from 'node-cron';
import { sendDailyDigest } from './mailer.js';
import { db } from './db.js';

let dailyTask = null;

export function initScheduler() {
  console.log('Initializing scheduled notifications service...');
  
  // Everyday at 22:00 (10 PM)
  dailyTask = cron.schedule('0 22 * * *', async () => {
    try {
      const settings = db.getSettings();
      const notif = settings.notifications || {};
      const hasAnyChannel = notif.gasWebhookUrl || (notif.telegramBotToken && notif.telegramChatId) || notif.lineToken || notif.emailRecipient;
      if (notif.dailyDigestEnabled && hasAnyChannel) {
        console.log('[Cron] Running daily nutrition and weight digest at 22:00...');
        await sendDailyDigest();
        console.log('[Cron] Daily digest sent successfully.');
      }
    } catch (err) {
      console.error('[Cron] Error executing daily digest:', err.message);
    }
  });

  // Weekly report: Every Sunday at 21:00
  cron.schedule('0 21 * * 0', async () => {
    console.log('[Cron] Weekly summary scheduled tick');
  });

  return { dailyTask };
}
