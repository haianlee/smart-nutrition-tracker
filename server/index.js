import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { db, getSystemDateStr } from './db.js';
import { analyzeFoodWithGemini } from './gemini.js';
import { sendDailyDigest, buildDailyReportHtml } from './mailer.js';
import { initScheduler } from './scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Upload directory setup
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `food_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// 1. Food Analysis API (Vision + Text)
app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
  try {
    const textInput = req.body.textInput || '';
    const customApiKey = req.body.apiKey || req.headers['x-gemini-key'] || '';
    
    let imageBuffer = null;
    let mimeType = null;
    let imageUrl = '';

    if (req.file) {
      imageBuffer = fs.readFileSync(req.file.path);
      mimeType = req.file.mimetype;
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(req.body.imageBase64, 'base64');
        mimeType = 'image/jpeg';
      }
    }

    if (!imageBuffer && !textInput.trim()) {
      return res.status(400).json({ error: '請提供食物照片或輸入食物名稱/重量' });
    }

    const settings = db.getSettings();
    const result = await analyzeFoodWithGemini({
      imageBuffer,
      mimeType,
      textInput,
      apiKey: customApiKey || settings.geminiApiKey,
      model: settings.geminiModel || 'gemini-3.8-flash'
    });

    res.json({
      success: true,
      imageUrl,
      analysis: result
    });
  } catch (err) {
    console.error('Error in /api/analyze-food:', err);
    res.status(500).json({
      error: err.message || '食物辨識分析失敗，請稍後再試。'
    });
  }
});

// 2. Meals CRUD
app.get('/api/meals', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const meals = db.getMeals({ date, startDate, endDate });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meals', (req, res) => {
  try {
    const meal = db.addMeal(req.body);
    res.status(201).json(meal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meals/:id', (req, res) => {
  try {
    const updated = db.updateMeal(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: '找不到該餐點記錄' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meals/:id', (req, res) => {
  try {
    const ok = db.deleteMeal(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Weight Records CRUD
app.get('/api/weights', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const weights = db.getWeights({ date, startDate, endDate });
    res.json(weights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/weights', (req, res) => {
  try {
    const record = db.addOrUpdateWeight(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/weights/:id', (req, res) => {
  try {
    const ok = db.deleteWeight(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Statistics & Continuous Trend Chart Data
app.get('/api/stats/daily', (req, res) => {
  try {
    const { date } = req.query;
    const summary = db.getDailySummary(date);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/trends', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = db.getContinuousTrends(days);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    // Mask sensitive credentials
    const safeSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        smtpPass: settings.notifications?.smtpPass ? '********' : ''
      }
    };
    res.json(safeSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const payload = req.body;
    // Don't overwrite password if masked
    if (payload.notifications?.smtpPass === '********') {
      delete payload.notifications.smtpPass;
    }
    const updated = db.updateSettings(payload);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual trigger email report
app.post('/api/send-report', async (req, res) => {
  try {
    const { date } = req.body;
    const result = await sendDailyDigest(date);
    res.json(result);
  } catch (err) {
    console.error('Error sending report:', err);
    res.status(500).json({ error: err.message || '郵件發送失敗' });
  }
});

// 7. Preview Email HTML
app.get('/api/preview-report-html', (req, res) => {
  try {
    const { date } = req.query;
    const settings = db.getSettings();
    const summary = db.getDailySummary(date);
    const html = buildDailyReportHtml(summary, settings);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 8. Seed Realistic Demo Data (Past 14 days)
app.post('/api/seed-demo', (req, res) => {
  try {
    const today = getSystemDateStr();
    const [ty, tm, td] = today.split('-').map(Number);
    // Seed 14 days of realistic meals and weights
    for (let i = 13; i >= 0; i--) {
      const d = new Date(ty, tm - 1, td - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      // Weight with realistic natural fluctuations
      const baseWeight = 72.5;
      const weightTrend = baseWeight - (13 - i) * 0.12 + (Math.sin(i) * 0.4);
      db.addOrUpdateWeight({
        date: dateStr,
        time: '07:30',
        weightKg: parseFloat(weightTrend.toFixed(2)),
        bodyFatPct: parseFloat((20.5 - (13 - i) * 0.08).toFixed(1)),
        notes: i === 0 ? '今晨測量' : '規律紀錄'
      });

      // Daily Meals (Breakfast, Lunch, Dinner)
      db.addMeal({
        date: dateStr,
        time: '08:30',
        mealType: 'breakfast',
        foodName: '茶葉蛋與燕麥豆漿',
        estimatedWeightG: 350,
        calories: 320,
        macros: { proteinG: 22, carbsG: 35, fatG: 8, fiberG: 5 },
        confidenceNote: '高纖蛋白質早餐'
      });

      db.addMeal({
        date: dateStr,
        time: '12:30',
        mealType: 'lunch',
        foodName: '舒肥雞胸肉健康餐盒',
        estimatedWeightG: 450,
        calories: 620,
        macros: { proteinG: 42, carbsG: 65, fatG: 16, fiberG: 6 },
        confidenceNote: '低脂高蛋白餐盒，糙米飯與綜合鮮蔬'
      });

      const dinnerCalories = 500 + Math.round(Math.sin(i * 1.5) * 150);
      db.addMeal({
        date: dateStr,
        time: '19:00',
        mealType: 'dinner',
        foodName: dinnerCalories > 600 ? '牛肉麵與燙青菜' : '烤鯖魚便當',
        estimatedWeightG: 420,
        calories: dinnerCalories,
        macros: { proteinG: 35, carbsG: 55, fatG: 20, fiberG: 4 },
        confidenceNote: '家常晚餐'
      });
    }

    res.json({ success: true, message: '成功匯入過去 14 天模擬健康數據！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Export CSV
app.get('/api/export-csv', (req, res) => {
  try {
    const meals = db.getMeals();
    const weights = db.getWeights();

    let csv = '\uFEFF'; // UTF-8 BOM
    csv += '【飲食記錄】\n日期,時間,餐別,食物名稱,推估重量(g),熱量(kcal),蛋白質(g),碳水化合物(g),脂肪(g),膳食纖維(g),備註\n';
    meals.forEach(m => {
      csv += `"${m.date}","${m.time}","${m.mealType}","${m.foodName}",${m.estimatedWeightG},${m.calories},${m.macros.proteinG},${m.macros.carbsG},${m.macros.fatG},${m.macros.fiberG},"${m.confidenceNote}"\n`;
    });

    csv += '\n【體重記錄】\n日期,時間,體重(kg),體脂率(%),備註\n';
    weights.forEach(w => {
      csv += `"${w.date}","${w.time}",${w.weightKg},${w.bodyFatPct || ''},"${w.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=nutrition_weight_data_${getSystemDateStr()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 10. Bidirectional Sync API (Protects against Render ephemeral disk wipes)
app.post('/api/sync', (req, res) => {
  try {
    const { meals = [], weights = [], settings = null } = req.body;
    const synced = db.syncData({ meals, weights, settings });
    res.json({
      success: true,
      message: '資料同步成功！',
      mealsCount: synced.meals.length,
      weightsCount: synced.weights.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Full JSON Backup download
app.get('/api/backup-json', (req, res) => {
  try {
    const allData = db.getAllData();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=nutrition_tracker_backup_${getSystemDateStr()}.json`);
    res.send(JSON.stringify(allData, null, 2));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 12. Full JSON Restore upload
app.post('/api/restore-json', (req, res) => {
  try {
    const imported = req.body;
    const ok = db.replaceAllData(imported);
    if (!ok) return res.status(400).json({ error: '無效的備份檔案格式' });
    res.json({ success: true, message: '資料庫已成功完整還原！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production (Priority: client/dist freshly built, then server/public)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const serverPublic = path.join(__dirname, 'public');

const PUBLIC_DIR = (fs.existsSync(clientDist) && fs.existsSync(path.join(clientDist, 'index.html')))
  ? clientDist
  : (fs.existsSync(serverPublic) && fs.existsSync(path.join(serverPublic, 'index.html')) ? serverPublic : null);

if (PUBLIC_DIR) {
  // Prevent mobile browsers from caching index.html to ensure users always receive latest bundle
  app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  app.use(express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });
}

// Start scheduler
initScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Nutrition & Weight Tracker Backend Server Started!`);
  console.log(`📡 Local API:   http://localhost:${PORT}`);
  console.log(`📱 Mobile Wi-Fi: http://<YOUR_LOCAL_IP>:${PORT}`);
  console.log(`====================================================`);
});
