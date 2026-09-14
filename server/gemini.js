// Using global fetch built into Node.js

const SYSTEM_PROMPT = `
你是一位專業的註冊營養師與食物影像辨識專家。
請仔細辨識照片中的所有食物、菜色或文字描述的餐點，並嚴格推估以下資訊：
1. 菜名 / 食物名稱 (food_name)
2. 推估總克數/重量 (estimated_weight_g)
3. 總熱量大卡 (calories)
4. 三大營養素與膳食纖維：
   - 蛋白質 (protein_g)
   - 碳水化合物 (carbs_g)
   - 脂肪 (fat_g)
   - 膳食纖維 (fiber_g)
5. 細項食材拆解與個別推估 (ingredients): 陣列，每個元素包含 {name, weight_g, calories}
6. 推估依據與信心備註 (confidence_note): 簡要說明主食、主菜份量與烹調方式（如炸、煎、清蒸、醬汁多寡等）

【重要輸出規則】
- 必須「只輸出標準 JSON」，不要包含任何額外的 Markdown 標記（例如不要包裹 \`\`\`json ），確保可被直接 JSON.parse()。
- 請嚴格遵循此格式：
{
  "food_name": "照燒雞腿便當",
  "estimated_weight_g": 450,
  "calories": 680,
  "macros": {
    "protein_g": 35,
    "carbs_g": 75,
    "fat_g": 22,
    "fiber_g": 4
  },
  "ingredients": [
    {"name": "白飯", "weight_g": 200, "calories": 260},
    {"name": "烤去骨雞腿", "weight_g": 150, "calories": 280},
    {"name": "炒青菜與滷蛋", "weight_g": 100, "calories": 140}
  ],
  "confidence_note": "主食為白飯約200g，主菜烤雞腿去骨約150g，配菜包含炒青菜與滷蛋"
}
`;

export async function analyzeFoodWithGemini({ imageBuffer, mimeType, textInput, apiKey, model = 'gemini-flash-lite-latest' }) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    // Return friendly simulated fallback if API key is not configured yet
    console.warn('GEMINI_API_KEY is not configured. Providing realistic simulated nutrition analysis.');
    return generateSimulatedNutrition(textInput || '上傳食物照');
  }

  // Choose high-speed model: gemini-flash-lite-latest or gemini-3.5-flash-lite
  const selectedModel = model === 'gemini-3.8-flash' ? 'gemini-flash-lite-latest' : model;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${effectiveKey}`;

  const contents = [];
  const parts = [];

  if (imageBuffer) {
    const base64Data = Buffer.isBuffer(imageBuffer) ? imageBuffer.toString('base64') : imageBuffer;
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data
      }
    });
  }

  const promptText = textInput 
    ? `使用者輸入食物品名或份量說明：「${textInput}」。
【特別規範】若使用者輸入包含具體商品名稱（例如特定品牌包裝食品）或明確重量（例如「孔雀捲心餅 63g」），請嚴格鎖定該指定品項與明確克數，推估或檢索其真實包裝營養標示，切勿覆寫或忽視使用者的克數！`
    : `請分析照片中的食物營養素與熱量。`;

  parts.push({ text: promptText });
  contents.push({ parts });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 350,
      responseMimeType: "application/json"
    }
  };

  try {
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // If selected model fails or has issues, fallback to gemini-flash-lite-latest or gemini-3.6-flash
    if (!res.ok && selectedModel !== 'gemini-3.6-flash') {
      console.warn(`Model ${selectedModel} returned ${res.status}. Falling back to gemini-3.6-flash...`);
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${effectiveKey}`;
      res = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error [${res.status}]: ${errText}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Clean potential markdown blocks if returned
    const cleanedText = candidateText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      isMock: false,
      food_name: parsed.food_name || '辨識餐點',
      estimated_weight_g: Number(parsed.estimated_weight_g) || 300,
      calories: Math.round(Number(parsed.calories) || 450),
      macros: {
        protein_g: Math.round(Number(parsed.macros?.protein_g) || 20),
        carbs_g: Math.round(Number(parsed.macros?.carbs_g) || 50),
        fat_g: Math.round(Number(parsed.macros?.fat_g) || 15),
        fiber_g: Math.round(Number(parsed.macros?.fiber_g) || 3)
      },
      ingredients: parsed.ingredients || [],
      confidence_note: parsed.confidence_note || 'Gemini 3.8 Flash 智慧分析完成'
    };
  } catch (err) {
    console.error('Failed to call Gemini API:', err);
    throw err;
  }
}

// Realistic simulation fallback for testing without immediate API key
function generateSimulatedNutrition(foodInput) {
  const cleanInput = (foodInput || '').trim();
  
  // Extract explicit weight if provided by user (e.g. 63g, 150克, 200ml)
  const weightMatch = cleanInput.match(/(\d+(?:\.\d+)?)\s*(?:g|克|ml|毫升|公克)/i);
  const userWeight = weightMatch ? parseFloat(weightMatch[1]) : null;

  const isSnack = /餅|捲心餅|洋芋片|零食|點心|泡芙|巧克力|餅乾|糖果|蛋糕/i.test(cleanInput);
  const isFruit = /香蕉|蘋果|芭樂|水果|橘子|西瓜/i.test(cleanInput);
  const isBeverage = /拿鐵|豆漿|咖啡|茶|鮮奶|飲料/i.test(cleanInput);
  const isMeat = /雞胸|牛排|豬排|肉|魚|蛋/i.test(cleanInput);

  if (isSnack) {
    const weight = userWeight || 60;
    // Snacks average ~5.1 kcal/g, 65% carbs, 25% fat, 5% protein
    const cals = Math.round(weight * 5.1);
    return {
      isMock: true,
      food_name: cleanInput || '包裝零食/餅乾',
      estimated_weight_g: weight,
      calories: cals,
      macros: {
        protein_g: Math.round(weight * 0.06 * 10) / 10,
        carbs_g: Math.round(weight * 0.65 * 10) / 10,
        fat_g: Math.round(weight * 0.25 * 10) / 10,
        fiber_g: Math.round(weight * 0.02 * 10) / 10
      },
      ingredients: [{ name: cleanInput, weight_g: weight, calories: cals }],
      confidence_note: '【示範模式】已依據您輸入的克數計算零食點心營養。若需即時精確包裝條碼聯網查詢，請在設定填入 Gemini API Key。'
    };
  } else if (isFruit) {
    const weight = userWeight || 150;
    const cals = Math.round(weight * 0.9);
    return {
      isMock: true,
      food_name: cleanInput || '新鮮水果',
      estimated_weight_g: weight,
      calories: cals,
      macros: {
        protein_g: Math.round(weight * 0.01 * 10) / 10,
        carbs_g: Math.round(weight * 0.23 * 10) / 10,
        fat_g: 0.3,
        fiber_g: Math.round(weight * 0.025 * 10) / 10
      },
      ingredients: [{ name: cleanInput, weight_g: weight, calories: cals }],
      confidence_note: '【示範模式】水果類依天然醣類換算。請至設定頁填入 Gemini API Key 啟用完整 AI 辨識。'
    };
  } else if (isBeverage) {
    const weight = userWeight || 400;
    const cals = Math.round(weight * 0.38);
    return {
      isMock: true,
      food_name: cleanInput || '無糖飲品',
      estimated_weight_g: weight,
      calories: cals,
      macros: {
        protein_g: Math.round(weight * 0.038 * 10) / 10,
        carbs_g: Math.round(weight * 0.02 * 10) / 10,
        fat_g: Math.round(weight * 0.015 * 10) / 10,
        fiber_g: 4
      },
      ingredients: [{ name: cleanInput, weight_g: weight, calories: cals }],
      confidence_note: '【示範模式】飲品依份量估算。'
    };
  } else if (isMeat) {
    const weight = userWeight || 150;
    const cals = Math.round(weight * 1.65);
    return {
      isMock: true,
      food_name: cleanInput || '肉類/蛋白質主食',
      estimated_weight_g: weight,
      calories: cals,
      macros: {
        protein_g: Math.round(weight * 0.28 * 10) / 10,
        carbs_g: 2,
        fat_g: Math.round(weight * 0.05 * 10) / 10,
        fiber_g: 0
      },
      ingredients: [{ name: cleanInput, weight_g: weight, calories: cals }],
      confidence_note: '【示範模式】優質蛋白質推估。'
    };
  }

  const weight = userWeight || 420;
  const cals = Math.round(weight * 1.5);
  return {
    isMock: true,
    food_name: cleanInput || '綜合健康餐盒',
    estimated_weight_g: weight,
    calories: cals,
    macros: {
      protein_g: Math.round(weight * 0.09),
      carbs_g: Math.round(weight * 0.16),
      fat_g: Math.round(weight * 0.04),
      fiber_g: 5
    },
    ingredients: [
      { name: cleanInput, weight_g: weight, calories: cals }
    ],
    confidence_note: '【示範模式】已採用您指定的重量計算。請點擊右上角 ⚙️ 設定填入 Gemini API Key 啟用真實 AI 辨識！'
  };
}

// -------------------------------------------------------------
// AI 每日飲食狀況診斷與明日飲食規劃 (Daily Diet Advisor & Planner)
// -------------------------------------------------------------
const ADVISOR_SYSTEM_PROMPT = `
你是一位具備十年以上臨床與運動體態管理經驗的專業註冊營養師。
你的任務是仔細閱讀使用者「當日整天的飲食狀況與健康數據」，給予精闢、客觀、溫暖且具高度執行力的「今日飲食狀況總結」與「明日具體飲食規劃建議」。

請嚴格遵守以下輸出規則：
1. 必須只輸出「標準 JSON」，絕對不要包含任何額外的 Markdown 標記（如不要包裹 \`\`\`json ），確保可直接 JSON.parse()。
2. 建議的菜色與食材請貼合台灣生活與外食習慣（如超商、便當店、自助餐、健康餐盒、家常自煮等）。
3. 請嚴格依照此 JSON 結構回傳：
{
  "score": 85,
  "grade": "優秀減脂 / 平衡維持 / 需適度微調 / 熱量顯著盈餘",
  "summary": "一句話或簡短精闢的今日飲食整體總結（約 40-60 字）",
  "highlights": [
    "今日做得好的亮點1（例如：蛋白質攝取充沛達標、多為原型食物）",
    "今日做得好的亮點2"
  ],
  "warnings": [
    "今日需要留意的失衡或風險點1（例如：蔬菜膳食纖維偏低、晚餐油脂偏高、精製糖過多）",
    "今日需要留意的失衡或風險點2"
  ],
  "tomorrowPlan": {
    "calorieTargetNote": "明日目標熱量與赤字調整說明（例如：明日建議維持 1800-1900 kcal，創造健康燃脂赤字）",
    "macroFocus": "明日三大營養素與纖維的補強策略重點（如提高深綠色蔬菜，蛋白質維持90g）",
    "suggestedMeals": [
      { "mealType": "早餐", "tip": "具體菜單搭配建議與推薦食材（如無糖豆漿 + 水煮蛋 + 地瓜）" },
      { "mealType": "午餐", "tip": "具體菜單搭配建議與推薦食材（如去皮雞腿便當，雙份深綠色蔬菜，飯半碗）" },
      { "mealType": "晚餐", "tip": "具體菜單搭配建議與推薦食材（如清蒸魚排或嫩豆腐味噌湯 + 溫沙拉）" }
    ],
    "actionableHabits": [
      "具體生活或飲水行為習慣1（如晨起溫水400cc，全日目標2000cc）",
      "具體生活或飲水行為習慣2（如若下午飢餓以無調味堅果或茶葉蛋替換加工甜點）"
    ]
  }
}
`;

export async function generateDailyDietAdvice({ dailySummary, userProfile = {}, apiKey, model = 'gemini-flash-lite-latest' }) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    console.warn('GEMINI_API_KEY is not configured. Providing simulated daily diet advice.');
    return generateSimulatedDailyAdvice(dailySummary, userProfile);
  }

  const selectedModel = model === 'gemini-3.8-flash' ? 'gemini-flash-lite-latest' : model;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${effectiveKey}`;

  const mealsDescription = (dailySummary.meals || []).map((m, idx) => {
    return `${idx + 1}. [${m.time || '未註記時間'} - ${m.mealType || '餐點'}] ${m.foodName} (${m.estimatedWeightG || 0}g) : 熱量 ${m.calories} kcal, 蛋白質 ${m.macros?.proteinG || 0}g, 碳水 ${m.macros?.carbsG || 0}g, 脂肪 ${m.macros?.fatG || 0}g, 纖維 ${m.macros?.fiberG || 0}g`;
  }).join('\n') || '（今日尚未登錄任何餐點）';

  const isDeficit = (dailySummary.deficit ?? 0) >= 0;
  const deficitStr = isDeficit ? `熱量赤字 -${dailySummary.deficit} kcal` : `熱量盈餘 +${Math.abs(dailySummary.deficit || 0)} kcal`;

  const promptText = `
以下是使用者在 ${dailySummary.date || '今日'} 的全天飲食攝取與健康數據報告：

【個人基本資料與目標】
- 性別：${userProfile.gender === 'female' ? '女性' : '男性'}
- 年齡：${userProfile.age || 28} 歲，身高：${userProfile.heightCm || 175} cm，當前體重：${dailySummary.weight ? dailySummary.weight + ' kg' : (userProfile.currentWeightKg ? userProfile.currentWeightKg + ' kg' : '未記錄')}
- 體脂率：${dailySummary.bodyFat ? dailySummary.bodyFat + '%' : '未記錄'}
- 每日維持熱量 (TDEE)：${dailySummary.tdee || 2200} kcal
- 每日目標攝取熱量：${dailySummary.targetCalories || 1900} kcal

【今日整天攝取統計】
- 今日總攝取熱量：${dailySummary.totalCalories || 0} kcal （相對於 TDEE 呈現：${deficitStr}）
- 蛋白質：${dailySummary.totalProtein || 0} g
- 碳水化合物：${dailySummary.totalCarbs || 0} g
- 脂肪：${dailySummary.totalFat || 0} g
- 膳食纖維：${dailySummary.totalFiber || 0} g
- 當日已記錄餐數：${dailySummary.mealCount || 0} 餐

【今日各餐明細清單】
${mealsDescription}

請根據以上真實數據，仔細分析使用者的熱量控制、三大營養素與膳食纖維平衡、各餐熱量分配，給予今日總結與明日飲食規劃建議。嚴格以標準 JSON 格式輸出！
`;

  const payload = {
    contents: [
      {
        parts: [{ text: promptText }]
      }
    ],
    systemInstruction: {
      parts: [{ text: ADVISOR_SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 850,
      responseMimeType: "application/json"
    }
  };

  try {
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok && selectedModel !== 'gemini-3.6-flash') {
      console.warn(`Model ${selectedModel} returned ${res.status}. Falling back to gemini-3.6-flash for advice...`);
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${effectiveKey}`;
      res = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Advisor API error [${res.status}]: ${errText}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API 未回傳內容');
    }

    const cleanedText = candidateText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      isMock: false,
      date: dailySummary.date,
      score: parsed.score || 85,
      grade: parsed.grade || '均衡維持',
      summary: parsed.summary || '今日熱量控制與飲食搭配符合健康標準。',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : ['熱量控制於合理範圍'],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : ['建議補充足夠水分與深綠色蔬菜'],
      tomorrowPlan: parsed.tomorrowPlan || {
        calorieTargetNote: `明日建議維持 ${dailySummary.targetCalories || 1900} kcal`,
        macroFocus: '均衡攝取優質蛋白質與原型碳水化合物',
        suggestedMeals: [
          { mealType: '早餐', tip: '無糖豆漿 + 茶葉蛋 + 地瓜' },
          { mealType: '午餐', tip: '健康雞胸肉餐盒，蔬菜加量' },
          { mealType: '晚餐', tip: '清蒸魚排 + 溫沙拉，澱粉適量' }
        ],
        actionableHabits: ['全日飲水量達 2000cc 以上']
      },
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error generating daily diet advice with Gemini:', err);
    // Graceful fallback to simulated advice
    return generateSimulatedDailyAdvice(dailySummary, userProfile);
  }
}

export function generateSimulatedDailyAdvice(dailySummary = {}, userProfile = {}) {
  const cals = dailySummary.totalCalories || 0;
  const tdee = dailySummary.tdee || 2200;
  const targetCal = dailySummary.targetCalories || 1900;
  const deficit = dailySummary.deficit ?? (tdee - cals);
  const protein = dailySummary.totalProtein || 0;
  const fiber = dailySummary.totalFiber || 0;

  if (cals === 0) {
    return {
      isMock: true,
      date: dailySummary.date,
      score: 60,
      grade: '尚未登錄餐點',
      summary: '今日尚未記錄飲食內容，建議用餐後及時拍照或輸入餐點，以利精準分析與健康評估。',
      highlights: ['及時記錄飲食有助於提高熱量感知與自我覺察'],
      warnings: ['尚未有餐點數據，無法評估巨量營養素與熱量平衡'],
      tomorrowPlan: {
        calorieTargetNote: `明日建議目標熱量為 ${targetCal} kcal`,
        macroFocus: '三餐定時定量，每餐補充足夠優質蛋白質',
        suggestedMeals: [
          { mealType: '早餐', tip: '無糖高纖豆漿 1 杯 + 水煮蛋 1 顆 + 烤地瓜 120g' },
          { mealType: '午餐', tip: '去皮雞腿便當，挑選雙份深綠色蔬菜，紫米飯半碗' },
          { mealType: '晚餐', tip: '嫩煎里肌豬排或豆腐菇類湯，清爽烹調減少油脂' }
        ],
        actionableHabits: [
          '起床先飲用溫水 350-500cc 啟動代謝',
          '用餐時養成先喝湯/吃菜、再吃蛋白質、最後吃澱粉的進食順序'
        ]
      },
      generatedAt: new Date().toISOString()
    };
  }

  // Calculate dynamic score and advice based on calories, protein, and deficit
  let score = 85;
  let grade = '優質減脂';
  const highlights = [];
  const warnings = [];

  if (deficit >= 200 && deficit <= 650) {
    highlights.push(`熱量赤字維持在 -${deficit} kcal，處於最不易流失肌肉的最佳燃脂區間`);
    score += 5;
  } else if (deficit > 650) {
    warnings.push(`熱量赤字高達 -${deficit} kcal，赤字偏大可能造成代謝下降與後續食慾反彈`);
    score -= 6;
    grade = '赤字過大微調';
  } else if (deficit < 0) {
    warnings.push(`今日熱量盈餘 +${Math.abs(deficit)} kcal，高於維持熱量 TDEE`);
    score -= 10;
    grade = '熱量超標需微調';
  } else {
    highlights.push('總熱量接近 TDEE 維持熱量，適合體重維持期');
    grade = '平衡維持';
  }

  if (protein >= 75) {
    highlights.push(`蛋白質攝取達 ${protein}g，有效提供肌肉修復與高飽足感`);
    score += 4;
  } else {
    warnings.push(`蛋白質攝取僅 ${protein}g，建議提高至體重 1.2-1.5 倍（約 75-90g）以防肌肉流失`);
    score -= 5;
  }

  if (fiber >= 16) {
    highlights.push(`膳食纖維攝取 ${fiber}g 表現優良，有助於腸道蠕動與血糖平穩`);
  } else {
    warnings.push(`膳食纖維僅 ${fiber}g，建議多吃深綠色蔬菜、芭樂或未精緻全穀雜糧`);
  }

  score = Math.max(65, Math.min(96, score));

  return {
    isMock: true,
    date: dailySummary.date,
    score,
    grade,
    summary: deficit >= 0 
      ? `今日飲食控制良好，創造了 ${deficit} kcal 的健康赤字，蛋白質與原型食物比重均在正軌上。`
      : `今日熱量略有盈餘 (+${Math.abs(deficit)} kcal)，明日午餐與晚餐可適度減少澱粉與烹調用油以維持每週平均平衡。`,
    highlights: highlights.length > 0 ? highlights : ['今日飲食記錄完整，掌控度高'],
    warnings: warnings.length > 0 ? warnings : ['注意充足飲水與良好睡眠'],
    tomorrowPlan: {
      calorieTargetNote: `明日建議攝取目標：${targetCal} kcal（維持約 ${Math.max(300, tdee - targetCal)} kcal 赤字）`,
      macroFocus: protein < 75 ? '重點補強早餐與午餐蛋白質（雞蛋、豆漿、雞胸肉）' : '維持當前高蛋白質水準，晚餐加強深綠色蔬菜',
      suggestedMeals: [
        { mealType: '早餐', tip: '無糖濃豆漿 300ml + 茶葉蛋/水煮蛋 1 顆 + 烤地瓜或燕麥 100g' },
        { mealType: '午餐', tip: '健康餐盒（如舒肥雞胸肉/烤魚），青菜雙倍，五穀米飯減至 1/2 碗' },
        { mealType: '晚餐', tip: '溫豆腐鮮魚湯 + 燙地瓜葉/花椰菜（少油少醬），避免精製澱粉' }
      ],
      actionableHabits: [
        '晨起先喝 400cc 溫水，全日飲水目標 2200cc',
        '晚餐盡量於 19:30 前結束，睡前 3 小時避免吃高鈉或甜食'
      ]
    },
    generatedAt: new Date().toISOString()
  };
}

