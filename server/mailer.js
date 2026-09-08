import nodemailer from 'nodemailer';
import { db } from './db.js';

export function createTransporter(settings) {
  const notif = settings?.notifications || {};
  if (!notif.smtpHost || !notif.smtpUser || !notif.smtpPass) {
    return null;
  }

  const isGmail = notif.smtpHost?.toLowerCase().includes('gmail');
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: notif.smtpUser,
        pass: notif.smtpPass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
  }

  return nodemailer.createTransport({
    host: notif.smtpHost,
    port: Number(notif.smtpPort) || 587,
    secure: Boolean(notif.smtpSecure),
    auth: {
      user: notif.smtpUser,
      pass: notif.smtpPass
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  });
}

export function buildDailyReportHtml(summary, settings) {
  const dateStr = summary.date;
  const isDeficit = summary.deficit >= 0;
  const deficitColor = isDeficit ? '#10b981' : '#ef4444';
  const deficitText = isDeficit ? `赤字 -${Math.abs(summary.deficit)} kcal (良好燃脂)` : `盈餘 +${Math.abs(summary.deficit)} kcal`;

  const mealsRows = summary.meals.map(m => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 8px; font-size: 14px;"><strong>${m.time}</strong></td>
      <td style="padding: 10px 8px; font-size: 14px;">
        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; background-color: #e0f2fe; color: #0369a1; margin-right: 4px;">
          ${m.mealType === 'breakfast' ? '早餐' : m.mealType === 'lunch' ? '午餐' : m.mealType === 'dinner' ? '晚餐' : '點心'}
        </span>
        ${m.foodName} (${m.estimatedWeightG}g)
      </td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: right; font-weight: bold; color: #f97316;">${m.calories} kcal</td>
      <td style="padding: 10px 8px; font-size: 13px; text-align: right; color: #64748b;">
        P:${m.macros?.proteinG || 0}g / C:${m.macros?.carbsG || 0}g / F:${m.macros?.fatG || 0}g
      </td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日飲食與體重結報 - ${dateStr}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🥗 每日飲食與熱量健康結報</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">日期：${dateStr}</p>
      </div>

      <!-- Highlights Grid -->
      <div style="display: flex; flex-wrap: wrap; padding: 16px; gap: 12px; background: #f1f5f9;">
        <div style="flex: 1; min-width: 120px; background: white; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">今日總攝取</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${summary.totalCalories} <span style="font-size: 12px; font-weight: normal;">kcal</span></div>
          <div style="font-size: 11px; color: #94a3b8;">目標: ${summary.targetCalories} kcal</div>
        </div>
        <div style="flex: 1; min-width: 120px; background: white; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">TDEE 淨盈虧</div>
          <div style="font-size: 18px; font-weight: 800; color: ${deficitColor}; margin-top: 4px;">${deficitText}</div>
          <div style="font-size: 11px; color: #94a3b8;">維持熱量: ${summary.tdee} kcal</div>
        </div>
        <div style="flex: 1; min-width: 120px; background: white; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
          <div style="font-size: 12px; color: #64748b;">今日體重</div>
          <div style="font-size: 20px; font-weight: 800; color: #3b82f6; margin-top: 4px;">${summary.weight !== null ? summary.weight + ' kg' : '未記錄'}</div>
          <div style="font-size: 11px; color: #94a3b8;">${summary.bodyFat ? '體脂 ' + summary.bodyFat + '%' : '連續追蹤中'}</div>
        </div>
      </div>

      <!-- Macros Summary -->
      <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #334155;">🥩 三大營養素攝取狀況</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #475569;">蛋白質 (Protein)</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">${summary.totalProtein}g</td>
            <td style="padding: 6px 0; text-align: right; color: #94a3b8; font-size: 12px;">(目標 ${settings.targetMacros?.proteinG || 130}g)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #475569;">碳水化合物 (Carbs)</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #f59e0b;">${summary.totalCarbs}g</td>
            <td style="padding: 6px 0; text-align: right; color: #94a3b8; font-size: 12px;">(目標 ${settings.targetMacros?.carbsG || 200}g)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #475569;">脂肪 (Fat)</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #06b6d4;">${summary.totalFat}g</td>
            <td style="padding: 6px 0; text-align: right; color: #94a3b8; font-size: 12px;">(目標 ${settings.targetMacros?.fatG || 60}g)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #475569;">膳食纖維 (Fiber)</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #10b981;">${summary.totalFiber}g</td>
            <td style="padding: 6px 0; text-align: right; color: #94a3b8; font-size: 12px;">(建議 > 25g)</td>
          </tr>
        </table>
      </div>

      <!-- Meal Details -->
      <div style="padding: 20px 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #334155;">📋 今日餐食明細 (${summary.mealCount} 餐)</h3>
        ${summary.mealCount > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; color: #64748b; font-size: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 8px;">時間</th>
                <th style="padding: 8px;">餐點</th>
                <th style="padding: 8px; text-align: right;">熱量</th>
                <th style="padding: 8px; text-align: right;">營養配比</th>
              </tr>
            </thead>
            <tbody>
              ${mealsRows}
            </tbody>
          </table>
        ` : `<p style="color: #94a3b8; font-size: 14px; text-align: center; padding: 20px 0;">今日尚未登錄餐點。</p>`}
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        此結報由 <strong>Smart Nutrition & Weight Tracker (Gemini AI Powered)</strong> 自動產生與發送。
      </div>
    </div>
  </body>
  </html>
  `;
}

export async function sendDailyDigest(dateStr = null) {
  const settings = db.getSettings();
  const notif = settings.notifications || {};
  const recipient = notif.emailRecipient;

  if (!recipient) {
    throw new Error('未設定接收通知的電子信箱 (請至設定中填寫 Email Recipient)');
  }

  const summary = db.getDailySummary(dateStr);
  const html = buildDailyReportHtml(summary, settings);

  // 1. If user provided a Resend API Key, use Resend HTTP API (Port 443, 100% immune to Render SMTP block)
  if (notif.resendApiKey && notif.resendApiKey.trim()) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notif.resendApiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: notif.smtpFrom || 'Smart Nutrition <onboarding@resend.dev>',
          to: recipient,
          subject: `【每日健康結報】${summary.date} 攝取 ${summary.totalCalories} kcal (${summary.deficit >= 0 ? '赤字 ' + summary.deficit : '盈餘 +' + Math.abs(summary.deficit)} kcal)`,
          html
        })
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(resendData.message || 'Resend API 發送失敗');
      }
      return { success: true, messageId: resendData.id, recipient, provider: 'resend' };
    } catch (err) {
      console.error('Resend send error:', err);
      throw new Error(`Resend 郵件發送失敗: ${err.message}`);
    }
  }

  // 2. Otherwise use SMTP with strict timeout
  const transporter = createTransporter(settings);
  if (!transporter) {
    throw new Error('尚未設定 SMTP 伺服器密碼或 Resend Key（請點擊右上角⚙️設定，或改用下方的「手機郵件 App 寄出」功能）');
  }

  const mailOptions = {
    from: notif.smtpFrom || `"飲食與體重管理" <${notif.smtpUser}>`,
    to: recipient,
    subject: `【每日健康結報】${summary.date} 攝取 ${summary.totalCalories} kcal (${summary.deficit >= 0 ? '赤字 ' + summary.deficit : '盈餘 +' + Math.abs(summary.deficit)} kcal)`,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, recipient, provider: 'smtp' };
  } catch (err) {
    console.error('SMTP send error:', err);
    if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKET' || err.message?.includes('timeout')) {
      throw new Error('SMTP 連線超時：Render 免費版雲端防火牆阻擋了外發 SMTP 埠 (587/465)。建議改用「📲 手機郵件 App 寄送」或在設定中填寫免費 Resend API Key！');
    }
    if (err.code === 'EAUTH' || err.message?.includes('Invalid login') || err.message?.includes('Username and Password not accepted')) {
      throw new Error('Gmail 驗證失敗：請填寫 Google 帳號安全性產生的 16 碼「應用程式專用密碼」，而非一般 Google 登入密碼！');
    }
    throw new Error(`SMTP 發送失敗: ${err.message}`);
  }
}
