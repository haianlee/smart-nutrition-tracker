import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
  meals: [],
  weights: [],
  settings: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: 'gemini-3.8-flash',
    userProfile: {
      gender: 'male',
      age: 28,
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate' // sedentary, light, moderate, active, very_active
    },
    tdee: 2200,
    targetCalories: 1900, // Default 300 kcal deficit
    targetMacros: {
      proteinG: 130,
      carbsG: 200,
      fatG: 60
    },
    notifications: {
      emailRecipient: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: 'Nutrition Tracker <no-reply@tracker.local>',
      dailyDigestEnabled: true,
      dailyDigestTime: '22:00',
      weeklyDigestDay: 0 // Sunday
    }
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(defaultData));
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      meals: parsed.meals || [],
      weights: parsed.weights || [],
      settings: { ...defaultData.settings, ...(parsed.settings || {}) }
    };
  } catch (err) {
    console.error('Error reading database file:', err);
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDb(data) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

export const db = {
  // --- MEALS ---
  getMeals(filters = {}) {
    const data = readDb();
    let meals = data.meals;
    if (filters.date) {
      meals = meals.filter(m => m.date === filters.date);
    }
    if (filters.startDate && filters.endDate) {
      meals = meals.filter(m => m.date >= filters.startDate && m.date <= filters.endDate);
    }
    return meals.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  },

  addMeal(meal) {
    const data = readDb();
    const newMeal = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: meal.date || new Date().toISOString().split('T')[0],
      time: meal.time || new Date().toTimeString().slice(0, 5),
      mealType: meal.mealType || 'lunch', // breakfast, lunch, dinner, snack
      foodName: meal.foodName || '未知食物',
      estimatedWeightG: Number(meal.estimatedWeightG) || 0,
      calories: Number(meal.calories) || 0,
      macros: {
        proteinG: Number(meal.macros?.proteinG || meal.proteinG || 0),
        carbsG: Number(meal.macros?.carbsG || meal.carbsG || 0),
        fatG: Number(meal.macros?.fatG || meal.fatG || 0),
        fiberG: Number(meal.macros?.fiberG || meal.fiberG || 0)
      },
      ingredients: meal.ingredients || [],
      confidenceNote: meal.confidenceNote || '',
      imageUrl: meal.imageUrl || '',
      createdAt: new Date().toISOString()
    };
    data.meals.push(newMeal);
    writeDb(data);
    return newMeal;
  },

  updateMeal(id, updates) {
    const data = readDb();
    const index = data.meals.findIndex(m => m.id === id);
    if (index === -1) return null;

    const existing = data.meals[index];
    const newMacros = updates.macros || (updates.proteinG !== undefined ? {
      proteinG: Number(updates.proteinG) || 0,
      carbsG: Number(updates.carbsG) || 0,
      fatG: Number(updates.fatG) || 0,
      fiberG: Number(updates.fiberG) || 0
    } : existing.macros);

    data.meals[index] = {
      ...existing,
      ...updates,
      estimatedWeightG: updates.estimatedWeightG !== undefined ? Number(updates.estimatedWeightG) : existing.estimatedWeightG,
      calories: updates.calories !== undefined ? Number(updates.calories) : existing.calories,
      macros: {
        proteinG: Number(newMacros.proteinG) || 0,
        carbsG: Number(newMacros.carbsG) || 0,
        fatG: Number(newMacros.fatG) || 0,
        fiberG: Number(newMacros.fiberG) || 0
      },
      updatedAt: new Date().toISOString()
    };
    writeDb(data);
    return data.meals[index];
  },

  deleteMeal(id) {
    const data = readDb();
    const initialLen = data.meals.length;
    data.meals = data.meals.filter(m => m.id !== id);
    if (data.meals.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // --- WEIGHTS ---
  getWeights(filters = {}) {
    const data = readDb();
    let weights = data.weights;
    if (filters.date) {
      weights = weights.filter(w => w.date === filters.date);
    }
    if (filters.startDate && filters.endDate) {
      weights = weights.filter(w => w.date >= filters.startDate && w.date <= filters.endDate);
    }
    return weights.sort((a, b) => a.date.localeCompare(b.date));
  },

  addOrUpdateWeight(entry) {
    const data = readDb();
    const date = entry.date || new Date().toISOString().split('T')[0];
    const index = data.weights.findIndex(w => w.date === date);
    
    const record = {
      id: index >= 0 ? data.weights[index].id : `w_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date,
      time: entry.time || new Date().toTimeString().slice(0, 5),
      weightKg: parseFloat(Number(entry.weightKg).toFixed(2)),
      bodyFatPct: entry.bodyFatPct !== undefined && entry.bodyFatPct !== null && entry.bodyFatPct !== '' ? parseFloat(Number(entry.bodyFatPct).toFixed(1)) : null,
      notes: entry.notes || '',
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      data.weights[index] = record;
    } else {
      data.weights.push(record);
    }
    writeDb(data);
    return record;
  },

  deleteWeight(id) {
    const data = readDb();
    const initialLen = data.weights.length;
    data.weights = data.weights.filter(w => w.id !== id);
    if (data.weights.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // --- SETTINGS ---
  getSettings() {
    const data = readDb();
    return data.settings;
  },

  updateSettings(newSettings) {
    const data = readDb();
    data.settings = {
      ...data.settings,
      ...newSettings,
      userProfile: {
        ...data.settings.userProfile,
        ...(newSettings.userProfile || {})
      },
      targetMacros: {
        ...data.settings.targetMacros,
        ...(newSettings.targetMacros || {})
      },
      notifications: {
        ...data.settings.notifications,
        ...(newSettings.notifications || {})
      }
    };
    writeDb(data);
    return data.settings;
  },

  // --- STATS & CONTINUOUS TREND CALCULATION ---
  getContinuousTrends(days = 30) {
    const data = readDb();
    const targetDate = new Date();
    const dateList = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - i);
      dateList.push(d.toISOString().split('T')[0]);
    }

    const tdee = data.settings.tdee || 2200;
    const targetCal = data.settings.targetCalories || 1900;

    // Map weights by date
    const weightMap = new Map();
    data.weights.forEach(w => weightMap.set(w.date, w.weightKg));

    // Map calories and macros by date
    const mealMap = new Map();
    data.meals.forEach(m => {
      if (!mealMap.has(m.date)) {
        mealMap.set(m.date, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 });
      }
      const dayData = mealMap.get(m.date);
      dayData.calories += Number(m.calories) || 0;
      dayData.protein += Number(m.macros?.proteinG) || 0;
      dayData.carbs += Number(m.macros?.carbsG) || 0;
      dayData.fat += Number(m.macros?.fatG) || 0;
      dayData.fiber += Number(m.macros?.fiberG) || 0;
      dayData.mealCount += 1;
    });

    // Compute trends and 7-day Moving Average (7-day MA) for weights
    // Sort all known weights historically to allow continuous smoothing
    const allSortedWeights = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));

    const result = dateList.map((dateStr, idx) => {
      const weight = weightMap.get(dateStr) || null;
      const mealInfo = mealMap.get(dateStr) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 };
      
      // Compute 7-day MA for weight: look at the 7 days ending on dateStr
      let windowSum = 0;
      let windowCount = 0;
      for (let offset = 0; offset < 7; offset++) {
        const pastD = new Date(dateStr);
        pastD.setDate(pastD.getDate() - offset);
        const pastDateStr = pastD.toISOString().split('T')[0];
        const val = weightMap.get(pastDateStr);
        if (val !== undefined && val !== null) {
          windowSum += val;
          windowCount += 1;
        }
      }
      const movingAvg7 = windowCount > 0 ? parseFloat((windowSum / windowCount).toFixed(2)) : null;

      const deficit = mealInfo.calories > 0 ? tdee - mealInfo.calories : 0;

      return {
        date: dateStr,
        weight: weight,
        movingAvg7: movingAvg7,
        calories: mealInfo.calories,
        targetCalories: targetCal,
        tdee: tdee,
        deficit: deficit, // Positive means deficit (burned more than ate), negative means surplus
        isDeficit: deficit >= 0,
        protein: mealInfo.protein,
        carbs: mealInfo.carbs,
        fat: mealInfo.fat,
        fiber: mealInfo.fiber,
        mealCount: mealInfo.mealCount
      };
    });

    return result;
  },

  getDailySummary(dateStr) {
    const data = readDb();
    const date = dateStr || new Date().toISOString().split('T')[0];
    const meals = data.meals.filter(m => m.date === date);
    const weightRecord = data.weights.find(w => w.date === date);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    meals.forEach(m => {
      totalCalories += Number(m.calories) || 0;
      totalProtein += Number(m.macros?.proteinG) || 0;
      totalCarbs += Number(m.macros?.carbsG) || 0;
      totalFat += Number(m.macros?.fatG) || 0;
      totalFiber += Number(m.macros?.fiberG) || 0;
    });

    const tdee = data.settings.tdee || 2200;
    const targetCalories = data.settings.targetCalories || 1900;
    const deficit = tdee - totalCalories;

    return {
      date,
      weight: weightRecord ? weightRecord.weightKg : null,
      bodyFat: weightRecord ? weightRecord.bodyFatPct : null,
      mealCount: meals.length,
      meals: meals.sort((a, b) => a.time.localeCompare(b.time)),
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalFiber,
      tdee,
      targetCalories,
      deficit,
      targetMacros: data.settings.targetMacros
    };
  },

  // --- AUTO SYNC & PERSISTENCE ---
  syncData({ meals = [], weights = [], settings = null }) {
    const data = readDb();

    // Merge meals by ID
    const mealMap = new Map();
    data.meals.forEach(m => mealMap.set(m.id, m));
    meals.forEach(m => {
      if (!mealMap.has(m.id)) {
        mealMap.set(m.id, m);
      } else {
        const existing = mealMap.get(m.id);
        const existingTime = existing.updatedAt || existing.createdAt || '';
        const clientTime = m.updatedAt || m.createdAt || '';
        if (clientTime >= existingTime) {
          mealMap.set(m.id, m);
        }
      }
    });
    data.meals = Array.from(mealMap.values());

    // Merge weights by date
    const weightMap = new Map();
    data.weights.forEach(w => weightMap.set(w.date, w));
    weights.forEach(w => {
      if (!weightMap.has(w.date)) {
        weightMap.set(w.date, w);
      } else {
        const existing = weightMap.get(w.date);
        const existingTime = existing.updatedAt || '';
        const clientTime = w.updatedAt || '';
        if (clientTime >= existingTime) {
          weightMap.set(w.date, w);
        }
      }
    });
    data.weights = Array.from(weightMap.values());

    if (settings) {
      data.settings = {
        ...data.settings,
        ...settings,
        userProfile: { ...data.settings.userProfile, ...(settings.userProfile || {}) },
        targetMacros: { ...data.settings.targetMacros, ...(settings.targetMacros || {}) },
        notifications: { ...data.settings.notifications, ...(settings.notifications || {}) }
      };
    }

    writeDb(data);
    return {
      meals: data.meals,
      weights: data.weights,
      settings: data.settings
    };
  },

  getAllData() {
    return readDb();
  },

  replaceAllData(imported) {
    if (imported && (Array.isArray(imported.meals) || Array.isArray(imported.weights))) {
      writeDb({
        meals: imported.meals || [],
        weights: imported.weights || [],
        settings: imported.settings || defaultData.settings
      });
      return true;
    }
    return false;
  }
};
