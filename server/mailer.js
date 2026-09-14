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

export function buildDailyReportHtml(summary, settings, advice = null) {
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

      <!-- AI Advisor & Tomorrow Planner -->
      ${advice ? `
      <div style="padding: 20px 24px; background: #f0fdf4; border-bottom: 1px solid #dcfce7;">
        <div style="margin-bottom: 10px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #166534;">🤖 AI 營養師總結與明日規劃</h3>
          <span style="display: inline-block; background: #bbf7d0; color: #15803d; font-size: 12px; font-weight: bold; padding: 2px 8px; border-radius: 999px;">
            評分：${advice.score} 分 (${advice.grade})
          </span>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.6; color: #14532d;">
          ${advice.summary}
        </p>

        <!-- Highlights & Warnings -->
        <div style="margin-bottom: 12px; font-size: 12px;">
          ${(advice.highlights || []).map(h => `<div style="color: #15803d; margin-bottom: 3px;">✅ ${h}</div>`).join('')}
          ${(advice.warnings || []).map(w => `<div style="color: #b45309; margin-bottom: 3px;">⚠️ ${w}</div>`).join('')}
        </div>

        <!-- Tomorrow Plan -->
        ${advice.tomorrowPlan ? `
        <div style="background: white; border-radius: 8px; padding: 12px; border: 1px solid #bbf7d0; font-size: 12px;">
          <strong style="color: #166534; display: block; margin-bottom: 6px;">📅 明日具體飲食建議：</strong>
          <div style="color: #475569; margin-bottom: 4px;">🎯 ${advice.tomorrowPlan.calorieTargetNote || ''}</div>
          <div style="color: #475569; margin-bottom: 8px;">🥗 ${advice.tomorrowPlan.macroFocus || ''}</div>
          ${(advice.tomorrowPlan.suggestedMeals || []).map(sm => `
            <div style="margin-bottom: 4px; color: #334155;"><strong>[${sm.mealType}]</strong> ${sm.tip}</div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

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

export function buildDailyReportText(summary, settings, advice = null) {
  const isDeficit = summary.deficit >= 0;
  const deficitText = isDeficit ? `赤字 -${Math.abs(summary.deficit)} kcal (良好燃脂)` : `盈餘 +${Math.abs(summary.deficit)} kcal`;
  
  let text = `🥗【每日健康飲食結報 - ${summary.date}】\n\n`;
  text += `📊 數據摘要：\n`;
  text += `• 今日攝取：${summary.totalCalories} kcal (目標: ${summary.targetCalories} kcal)\n`;
  text += `• TDEE 盈虧：${deficitText}\n`;
  if (summary.weight !== null && summary.weight !== undefined) {
    text += `• 今日體重：${summary.weight} kg ${summary.bodyFat ? `(體脂 ${summary.bodyFat}%)` : ''}\n`;
  }
  text += `\n🥩 三大營養素：\n`;
  text += `• 蛋白質：${summary.totalProtein}g / 目標 ${settings.targetMacros?.proteinG || 130}g\n`;
  text += `• 碳水化合物：${summary.totalCarbs}g / 目標 ${settings.targetMacros?.carbsG || 200}g\n`;
  text += `• 脂肪：${summary.totalFat}g / 目標 ${settings.targetMacros?.fatG || 60}g\n`;
  text += `• 膳食纖維：${summary.totalFiber}g\n`;

  if (advice) {
    text += `\n🤖 AI 營養師總結 (${advice.score}分 - ${advice.grade})：\n`;
    text += `${advice.summary}\n`;
    if (advice.highlights?.length) {
      text += `\n✅ 亮點：\n` + advice.highlights.map(h => `• ${h}`).join('\n') + `\n`;
    }
    if (advice.warnings?.length) {
      text += `\n⚠️ 待注意：\n` + advice.warnings.map(w => `• ${w}`).join('\n') + `\n`;
    }
    if (advice.tomorrowPlan) {
      text += `\n📅 明日建議規劃：\n`;
      if (advice.tomorrowPlan.calorieTargetNote) text += `🎯 ${advice.tomorrowPlan.calorieTargetNote}\n`;
      if (advice.tomorrowPlan.macroFocus) text += `🥗 ${advice.tomorrowPlan.macroFocus}\n`;
      if (advice.tomorrowPlan.suggestedMeals?.length) {
        text += advice.tomorrowPlan.suggestedMeals.map(m => `• [${m.mealType}] ${m.tip}`).join('\n') + `\n`;
      }
    }
  }

  if (summary.meals && summary.meals.length > 0) {
    text += `\n📋 今日餐食 (${summary.mealCount}餐)：\n`;
    text += summary.meals.map(m => `• [${m.time}] ${m.foodName} (${m.estimatedWeightG}g): ${m.calories}kcal`).join('\n');
  }

  return text;
}

export async function sendDailyDigest(dateStr = null) {
  const settings = db.getSettings();
  const notif = settings.notifications || {};
  const recipient = notif.emailRecipient;

  const summary = db.getDailySummary(dateStr);
  const advice = db.getDailyAdvice(summary.date);
  const html = buildDailyReportHtml(summary, settings, advice);
  const textSummary = buildDailyReportText(summary, settings, advice);

  const results = [];
  const errors = [];

  const subject = `【每日健康結報】${summary.date} 攝取 ${summary.totalCalories} kcal (${summary.deficit >= 0 ? '赤字 ' + summary.deficit : '盈餘 +' + Math.abs(summary.deficit)} kcal)`;

  // ==========================================
  // 1. 方案 B: Google Apps Script Webhook (免網域寄發 Gmail)
  // ==========================================
  if (notif.gasWebhookUrl && notif.gasWebhookUrl.trim().startsWith('http')) {
    try {
      const gasRes = await fetch(notif.gasWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipient || undefined,
          subject,
          htmlBody: html,
          textBody: textSummary
        })
      });

      const gasText = await gasRes.text();
      let gasData = {};
      try { gasData = JSON.parse(gasText); } catch (e) { gasData = { raw: gasText }; }

      if (gasRes.ok && (gasData.status === 'success' || !gasData.status)) {
        results.push({ provider: 'gas', message: '已透過 Google Apps Script (Gmail) 成功寄出結報！' });
      } else {
        throw new Error(gasData.message || gasText || 'Google Apps Script 回應異常');
      }
    } catch (err) {
      console.error('GAS send error:', err);
      errors.push(`Google Apps Script 失敗: ${err.message}`);
    }
  }

  // ==========================================
  // 2. 方案 C: Telegram Bot 即時推播 (手機最快收到)
  // ==========================================
  if (notif.telegramBotToken && notif.telegramChatId) {
    try {
      const tgToken = notif.telegramBotToken.trim();
      const tgChatId = notif.telegramChatId.trim();
      const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: textSummary
        })
      });

      const tgData = await tgRes.json();
      if (tgRes.ok && tgData.ok) {
        results.push({ provider: 'telegram', message: '已透過 Telegram Bot 成功推播至您的手機！' });
      } else {
        throw new Error(tgData.description || 'Telegram API 回應錯誤');
      }
    } catch (err) {
      console.error('Telegram send error:', err);
      errors.push(`Telegram 推播失敗: ${err.message}`);
    }
  }

  // ==========================================
  // 3. 方案 C: LINE Notify / Messaging API Webhook
  // ==========================================
  if (notif.lineToken && notif.lineToken.trim()) {
    try {
      const lineToken = notif.lineToken.trim();
      const lineRes = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lineToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          message: `\n${textSummary}`
        })
      });

      const lineData = await lineRes.json();
      if (lineRes.ok && lineData.status === 200) {
        results.push({ provider: 'line', message: '已透過 LINE 成功發送推播！' });
      } else {
        throw new Error(lineData.message || 'LINE API 回應錯誤');
      }
    } catch (err) {
      console.error('LINE send error:', err);
      errors.push(`LINE 推播失敗: ${err.message}`);
    }
  }

  // ==========================================
  // 4. Resend HTTP API (若有填寫 Resend Key)
  // ==========================================
  if (notif.resendApiKey && notif.resendApiKey.trim() && recipient) {
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
          subject,
          html
        })
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        results.push({ provider: 'resend', message: `已透過 Resend API 發送至 ${recipient}` });
      } else {
        throw new Error(resendData.message || 'Resend API 發送失敗');
      }
    } catch (err) {
      console.error('Resend send error:', err);
      errors.push(`Resend 失敗: ${err.message}`);
    }
  }

  // ==========================================
  // 5. 傳統 SMTP (若未設定 GAS / Telegram / Resend，才退回到 SMTP)
  // ==========================================
  const hasModernChannel = notif.gasWebhookUrl || (notif.telegramBotToken && notif.telegramChatId) || notif.lineToken || notif.resendApiKey;
  if (!hasModernChannel && recipient) {
    const transporter = createTransporter(settings);
    if (transporter) {
      try {
        await transporter.sendMail({
          from: notif.smtpFrom || `"飲食與體重管理" <${notif.smtpUser}>`,
          to: recipient,
          subject,
          html
        });
        results.push({ provider: 'smtp', message: `已透過 SMTP 伺服器發送至 ${recipient}` });
      } catch (err) {
        console.error('SMTP send error:', err);
        if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKET' || err.message?.includes('timeout')) {
          errors.push('SMTP 連線超時：Render 雲端封鎖了 SMTP 埠 (587/465)。強烈建議設定「方案 B (Google Apps Script)」或「方案 C (Telegram)」！');
        } else {
          errors.push(`SMTP 失敗: ${err.message}`);
        }
      }
    } else {
      errors.push('尚未配置有效的通知發送管道（請至設定中配置 Google Apps Script 或 Telegram Bot）。');
    }
  }

  // 總結發送結果
  if (results.length > 0) {
    return {
      success: true,
      providers: results.map(r => r.provider),
      summary: results.map(r => r.message).join(' | '),
      warnings: errors.length > 0 ? errors : undefined,
      recipient: recipient || '已推播至通訊軟體'
    };
  } else {
    const errMsg = errors.join('；') || '未設定任何發送管道，請至設定頁面設定 Google Apps Script Webhook 或 Telegram Bot。';
    throw new Error(errMsg);
  }
}

