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
