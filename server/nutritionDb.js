// Taiwan FDA & Common Food Fast Lookup Database (毫秒級超速本地查表庫)
// 徹底消除純文字飲食查詢時 Google AI 尖峰等待 30 秒的延遲

export const COMMON_TAIWAN_FOODS = [
  // 蛋豆魚肉類
  { names: ['茶葉蛋'], unitWeight: 50, calories: 75, p: 7.0, c: 1.0, f: 5.0, fib: 0 },
  { names: ['水煮蛋', '水波蛋'], unitWeight: 50, calories: 70, p: 6.8, c: 0.6, f: 4.8, fib: 0 },
  { names: ['荷包蛋', '煎蛋'], unitWeight: 60, calories: 110, p: 7.2, c: 1.2, f: 8.5, fib: 0 },
  { names: ['茶碗蒸', '蒸蛋'], unitWeight: 120, calories: 85, p: 6.5, c: 2.5, f: 5.2, fib: 0 },
  { names: ['雞胸肉', '舒肥雞胸肉', '舒肥雞胸'], unitWeight: 150, calories: 165, p: 34.5, c: 0.8, f: 2.3, fib: 0 },
  { names: ['板豆腐'], unitWeight: 100, calories: 88, p: 8.5, c: 1.5, f: 5.5, fib: 0.6 },
  { names: ['嫩豆腐'], unitWeight: 140, calories: 70, p: 7.0, c: 2.8, f: 3.5, fib: 0.4 },
  { names: ['鮭魚排', '煎鮭魚', '烤鮭魚'], unitWeight: 150, calories: 280, p: 30.0, c: 0, f: 17.5, fib: 0 },
  { names: ['牛排', '煎牛排'], unitWeight: 180, calories: 360, p: 38.0, c: 0, f: 22.0, fib: 0 },

  // 飲品類
  { names: ['無糖綠茶', '綠茶', '日式綠茶'], unitWeight: 500, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖烏龍茶', '烏龍茶', '凍頂烏龍'], unitWeight: 500, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖紅茶', '紅茶'], unitWeight: 500, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['四季春', '青茶', '高山茶', '麥茶'], unitWeight: 500, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['美式咖啡', '黑咖啡', '美式黑咖啡'], unitWeight: 360, calories: 5, p: 0.5, c: 0.8, f: 0.1, fib: 0 },
  { names: ['拿鐵', '拿鐵咖啡', '無糖拿鐵'], unitWeight: 360, calories: 170, p: 8.5, c: 13.0, f: 9.5, fib: 0 },
  { names: ['無糖豆漿', '高纖無糖豆漿', '豆漿'], unitWeight: 400, calories: 130, p: 13.6, c: 4.8, f: 6.4, fib: 3.2 },
  { names: ['低脂鮮奶', '鮮奶', '牛奶'], unitWeight: 290, calories: 135, p: 9.0, c: 14.0, f: 4.5, fib: 0 },
  { names: ['燕麥奶'], unitWeight: 300, calories: 150, p: 3.0, c: 24.0, f: 4.5, fib: 2.0 },
  { names: ['水', '白開水', '氣泡水', '純水'], unitWeight: 600, calories: 0, p: 0, c: 0, f: 0, fib: 0 },

  // 水果類
  { names: ['香蕉', '熟香蕉'], unitWeight: 140, calories: 120, p: 1.5, c: 29.0, f: 0.2, fib: 2.5 },
  { names: ['蘋果'], unitWeight: 180, calories: 95, p: 0.5, c: 25.0, f: 0.3, fib: 4.0 },
  { names: ['芭樂', '珍珠芭樂'], unitWeight: 200, calories: 76, p: 1.6, c: 18.0, f: 0.2, fib: 6.0 },
  { names: ['奇異果'], unitWeight: 100, calories: 60, p: 1.2, c: 14.5, f: 0.5, fib: 3.0 },
  { names: ['小番茄', '聖女小番茄'], unitWeight: 150, calories: 45, p: 1.5, c: 9.5, f: 0.3, fib: 2.2 },
  { names: ['木瓜'], unitWeight: 200, calories: 80, p: 1.0, c: 19.5, f: 0.2, fib: 3.0 },

  // 全穀雜糧與主食
  { names: ['地瓜', '烤地瓜', '蒸地瓜'], unitWeight: 150, calories: 180, p: 2.0, c: 42.0, f: 0.3, fib: 3.8 },
  { names: ['白飯一碗', '白飯', '白米飯'], unitWeight: 200, calories: 280, p: 5.0, c: 60.0, f: 0.6, fib: 1.0 },
  { names: ['白飯半碗', '半碗飯'], unitWeight: 100, calories: 140, p: 2.5, c: 30.0, f: 0.3, fib: 0.5 },
  { names: ['糙米飯', '五穀飯', '紫米飯'], unitWeight: 180, calories: 240, p: 5.5, c: 50.0, f: 1.8, fib: 3.5 },
  { names: ['燕麥片', '大燕麥片'], unitWeight: 50, calories: 190, p: 6.5, c: 33.0, f: 4.0, fib: 4.5 },
  { names: ['全麥吐司'], unitWeight: 40, calories: 105, p: 4.0, c: 19.0, f: 1.5, fib: 2.0 },
  { names: ['白吐司'], unitWeight: 40, calories: 115, p: 3.5, c: 22.0, f: 1.5, fib: 0.8 },
  { names: ['御飯糰', '鮪魚飯糰', '肉鬆飯糰'], unitWeight: 110, calories: 210, p: 5.5, c: 38.0, f: 3.8, fib: 1.0 },

  // 外食便當與麵食
  { names: ['健康餐盒', '低卡餐盒', '水煮餐盒'], unitWeight: 450, calories: 520, p: 38.0, c: 62.0, f: 12.0, fib: 6.0 },
  { names: ['排骨便當', '炸排骨便當'], unitWeight: 500, calories: 850, p: 32.0, c: 110.0, f: 32.0, fib: 3.5 },
  { names: ['雞腿便當', '炸雞腿便當'], unitWeight: 550, calories: 920, p: 38.0, c: 115.0, f: 36.0, fib: 3.5 },
  { names: ['滷雞腿便當', '烤雞腿便當'], unitWeight: 500, calories: 750, p: 38.0, c: 98.0, f: 22.0, fib: 4.0 },
  { names: ['滷肉飯'], unitWeight: 220, calories: 440, p: 12.0, c: 58.0, f: 18.0, fib: 0.8 },
  { names: ['牛肉麵', '紅燒牛肉麵'], unitWeight: 600, calories: 720, p: 35.0, c: 80.0, f: 28.0, fib: 3.0 },
  { names: ['清燉牛肉麵'], unitWeight: 600, calories: 580, p: 36.0, c: 75.0, f: 15.0, fib: 3.0 },
  { names: ['陽春麵', '湯麵'], unitWeight: 450, calories: 340, p: 10.0, c: 60.0, f: 6.0, fib: 2.0 },
  { names: ['乾麵', '麻醬麵'], unitWeight: 300, calories: 520, p: 14.0, c: 68.0, f: 22.0, fib: 2.5 },
  { names: ['燙青菜'], unitWeight: 150, calories: 65, p: 3.0, c: 6.0, f: 3.5, fib: 3.8 },

  // 常見超商零食點心
  { names: ['孔雀捲心餅'], unitWeight: 63, calories: 330, p: 3.5, c: 42.0, f: 16.5, fib: 1.0 },
  { names: ['義美小泡芙'], unitWeight: 65, calories: 380, p: 4.5, c: 41.0, f: 22.0, fib: 1.0 },
  { names: ['洋芋片'], unitWeight: 50, calories: 270, p: 3.0, c: 28.0, f: 16.5, fib: 1.5 },
  { names: ['黑巧克力 (70%以上)', '黑巧克力'], unitWeight: 30, calories: 175, p: 2.5, c: 13.0, f: 12.5, fib: 3.0 }
];

/**
 * 從使用者輸入文字中解析數量/重量，並對照本地資料庫
 * @param {string} text 
 * @param {Array} pastMeals 
 */
export function fastLookupFood(text, pastMeals = []) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (!clean) return null;

  // 1. 解析指定克數/毫升/份量 (例: 63g, 150克, 200ml, 2顆, 半碗)
  let parsedWeight = null;
  const gMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|克|ml|毫升|公克)/i);
  if (gMatch) {
    parsedWeight = parseFloat(gMatch[1]);
  }

  let countMultiplier = 1;
  const countMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:顆|個|隻|條|片|碗|份|杯|罐|瓶)/);
  if (countMatch && !parsedWeight) {
    countMultiplier = parseFloat(countMatch[1]);
  } else if (/半碗/.test(clean)) {
    countMultiplier = 0.5;
  }

  // 2. 優先比對使用者的歷史個人記錄 (Personal History Matching)
  if (pastMeals && pastMeals.length > 0) {
    for (const m of pastMeals) {
      const histName = (m.foodName || '').trim();
      if (!histName) continue;

      // 檢查是否完全吻合或包含關鍵品名
      const isMatch = clean.includes(histName) || histName.includes(clean.replace(/\d+.*$/, '').trim());
      if (isMatch) {
        const baseW = Number(m.estimatedWeightG) || 100;
        const targetW = parsedWeight || (baseW * countMultiplier);
        const ratio = targetW / baseW;

        const cal = Math.round(Number(m.calories || 0) * ratio);
        const p = Math.round((Number(m.macros?.proteinG || 0) * ratio) * 10) / 10;
        const c = Math.round((Number(m.macros?.carbsG || 0) * ratio) * 10) / 10;
        const f = Math.round((Number(m.macros?.fatG || 0) * ratio) * 10) / 10;
        const fib = Math.round((Number(m.macros?.fiberG || 0) * ratio) * 10) / 10;

        return {
          isMock: false,
          food_name: histName,
          estimated_weight_g: Math.round(targetW),
          calories: cal,
          macros: { protein_g: p, carbs_g: c, fat_g: f, fiber_g: fib },
          ingredients: m.ingredients || [{ name: histName, weight_g: Math.round(targetW), calories: cal }],
          confidence_note: `⚡ 0.01秒極速比對個人歷史記錄 (${histName})`
        };
      }
    }
  }

  // 3. 比對常見台灣常見食物資料庫 (Common Taiwan Foods)
  for (const item of COMMON_TAIWAN_FOODS) {
    const matchedName = item.names.find(n => clean.toLowerCase().includes(n.toLowerCase()));
    if (matchedName) {
      const baseW = item.unitWeight;
      const targetW = parsedWeight || (baseW * countMultiplier);
      const ratio = targetW / baseW;

      const cal = Math.round(item.calories * ratio);
      const p = Math.round((item.p * ratio) * 10) / 10;
      const c = Math.round((item.c * ratio) * 10) / 10;
      const f = Math.round((item.f * ratio) * 10) / 10;
      const fib = Math.round((item.fib * ratio) * 10) / 10;

      return {
        isMock: false,
        food_name: matchedName,
        estimated_weight_g: Math.round(targetW),
        calories: cal,
        macros: { protein_g: p, carbs_g: c, fat_g: f, fiber_g: fib },
        ingredients: [{ name: matchedName, weight_g: Math.round(targetW), calories: cal }],
        confidence_note: `⚡ 0.01秒極速查表完成 (台灣常見食品資料庫・${matchedName})`
      };
    }
  }

  return null;
}
