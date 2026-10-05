// Taiwan FDA & Common Food Fast Lookup Database (毫秒級超速本地查表庫)
// 徹底消除純文字飲食查詢時 Google AI 尖峰等待的延遲，並具備嚴謹詞彙比對防呆

export const COMMON_TAIWAN_FOODS = [
  // 水餃、煎餃、點心麵點類 (最常見外食)
  { names: ['水餃', '高麗菜水餃', '韭菜水餃', '豬肉水餃', '高麗菜豬肉水餃', '韭菜豬肉水餃', '冷凍水餃'], unitWeight: 25, defaultCount: 10, calories: 55, p: 2.3, c: 5.5, f: 2.7, fib: 0.3 },
  { names: ['鍋貼', '煎餃'], unitWeight: 30, defaultCount: 10, calories: 75, p: 2.5, c: 7.2, f: 4.2, fib: 0.3 },
  { names: ['蒸餃'], unitWeight: 25, defaultCount: 8, calories: 50, p: 2.4, c: 5.2, f: 2.2, fib: 0.3 },
  { names: ['水煎包'], unitWeight: 80, defaultCount: 1, calories: 180, p: 5.5, c: 24.0, f: 7.2, fib: 1.0 },
  { names: ['小籠包', '湯包'], unitWeight: 30, defaultCount: 8, calories: 65, p: 2.8, c: 5.5, f: 3.5, fib: 0.2 },
  { names: ['小籠湯包'], unitWeight: 30, defaultCount: 8, calories: 70, p: 3.0, c: 5.5, f: 4.0, fib: 0.2 },
  { names: ['肉包', '鮮肉包'], unitWeight: 100, defaultCount: 1, calories: 250, p: 8.5, c: 35.0, f: 8.5, fib: 1.0 },
  { names: ['菜包', '素菜包'], unitWeight: 100, defaultCount: 1, calories: 200, p: 5.5, c: 36.0, f: 4.0, fib: 2.0 },
  { names: ['饅頭', '白饅頭'], unitWeight: 100, defaultCount: 1, calories: 280, p: 7.5, c: 58.0, f: 1.5, fib: 1.5 },
  { names: ['銀絲卷'], unitWeight: 80, defaultCount: 1, calories: 240, p: 6.0, c: 42.0, f: 5.5, fib: 1.0 },

  // 蛋豆魚肉類
  { names: ['茶葉蛋'], unitWeight: 50, defaultCount: 1, calories: 75, p: 7.0, c: 1.0, f: 5.0, fib: 0 },
  { names: ['水煮蛋', '水波蛋'], unitWeight: 50, defaultCount: 1, calories: 70, p: 6.8, c: 0.6, f: 4.8, fib: 0 },
  { names: ['荷包蛋', '煎蛋'], unitWeight: 60, defaultCount: 1, calories: 110, p: 7.2, c: 1.2, f: 8.5, fib: 0 },
  { names: ['滷蛋'], unitWeight: 50, defaultCount: 1, calories: 85, p: 7.0, c: 1.5, f: 5.8, fib: 0 },
  { names: ['茶碗蒸', '蒸蛋'], unitWeight: 120, defaultCount: 1, calories: 85, p: 6.5, c: 2.5, f: 5.2, fib: 0 },
  { names: ['舒肥雞胸肉', '雞胸肉', '舒肥雞胸'], unitWeight: 150, defaultCount: 1, calories: 165, p: 34.5, c: 0.8, f: 2.3, fib: 0 },
  { names: ['炸雞排', '雞排'], unitWeight: 200, defaultCount: 1, calories: 550, p: 35.0, c: 32.0, f: 32.0, fib: 0.5 },
  { names: ['板豆腐'], unitWeight: 100, defaultCount: 1, calories: 88, p: 8.5, c: 1.5, f: 5.5, fib: 0.6 },
  { names: ['嫩豆腐'], unitWeight: 140, defaultCount: 1, calories: 70, p: 7.0, c: 2.8, f: 3.5, fib: 0.4 },
  { names: ['豆干', '大溪豆乾', '小豆干'], unitWeight: 80, defaultCount: 1, calories: 130, p: 15.0, c: 3.0, f: 6.5, fib: 1.0 },
  { names: ['鮭魚排', '煎鮭魚', '烤鮭魚'], unitWeight: 150, defaultCount: 1, calories: 280, p: 30.0, c: 0, f: 17.5, fib: 0 },
  { names: ['牛排', '煎牛排'], unitWeight: 180, defaultCount: 1, calories: 360, p: 38.0, c: 0, f: 22.0, fib: 0 },

  // 早午餐類
  { names: ['原味蛋餅', '蛋餅'], unitWeight: 130, defaultCount: 1, calories: 260, p: 9.0, c: 30.0, f: 11.5, fib: 1.0 },
  { names: ['鮪魚蛋餅'], unitWeight: 150, defaultCount: 1, calories: 320, p: 16.0, c: 31.0, f: 14.5, fib: 1.0 },
  { names: ['起司蛋餅'], unitWeight: 140, defaultCount: 1, calories: 310, p: 13.0, c: 30.0, f: 15.5, fib: 1.0 },
  { names: ['玉米蛋餅'], unitWeight: 150, defaultCount: 1, calories: 290, p: 9.5, c: 35.0, f: 12.0, fib: 1.5 },
  { names: ['蘿蔔糕', '煎蘿蔔糕'], unitWeight: 140, defaultCount: 1, calories: 230, p: 4.5, c: 36.0, f: 7.5, fib: 1.5 },
  { names: ['飯糰', '傳統飯糰'], unitWeight: 200, defaultCount: 1, calories: 450, p: 12.0, c: 68.0, f: 15.0, fib: 2.0 },
  { names: ['燒餅油條'], unitWeight: 150, defaultCount: 1, calories: 480, p: 10.0, c: 55.0, f: 24.0, fib: 2.0 },

  // 外食便當與麵食
  { names: ['健康餐盒', '低卡餐盒', '水煮餐盒'], unitWeight: 450, defaultCount: 1, calories: 520, p: 38.0, c: 62.0, f: 12.0, fib: 6.0 },
  { names: ['排骨便當', '炸排骨便當'], unitWeight: 500, defaultCount: 1, calories: 850, p: 32.0, c: 110.0, f: 32.0, fib: 3.5 },
  { names: ['雞腿便當', '炸雞腿便當'], unitWeight: 550, defaultCount: 1, calories: 920, p: 38.0, c: 115.0, f: 36.0, fib: 3.5 },
  { names: ['滷雞腿便當', '烤雞腿便當'], unitWeight: 500, defaultCount: 1, calories: 750, p: 38.0, c: 98.0, f: 22.0, fib: 4.0 },
  { names: ['滷肉飯'], unitWeight: 220, defaultCount: 1, calories: 440, p: 12.0, c: 58.0, f: 18.0, fib: 0.8 },
  { names: ['雞肉飯', '火雞肉飯'], unitWeight: 220, defaultCount: 1, calories: 380, p: 16.0, c: 56.0, f: 10.0, fib: 0.8 },
  { names: ['紅燒牛肉麵', '牛肉麵'], unitWeight: 600, defaultCount: 1, calories: 720, p: 35.0, c: 80.0, f: 28.0, fib: 3.0 },
  { names: ['清燉牛肉麵'], unitWeight: 600, defaultCount: 1, calories: 580, p: 36.0, c: 75.0, f: 15.0, fib: 3.0 },
  { names: ['陽春麵', '湯麵'], unitWeight: 450, defaultCount: 1, calories: 340, p: 10.0, c: 60.0, f: 6.0, fib: 2.0 },
  { names: ['餛飩麵'], unitWeight: 500, defaultCount: 1, calories: 480, p: 18.0, c: 68.0, f: 14.0, fib: 2.0 },
  { names: ['麻醬麵', '乾麵'], unitWeight: 300, defaultCount: 1, calories: 520, p: 14.0, c: 68.0, f: 22.0, fib: 2.5 },
  { names: ['涼麵', '麻醬涼麵'], unitWeight: 250, defaultCount: 1, calories: 490, p: 13.0, c: 62.0, f: 21.0, fib: 2.5 },
  { names: ['炒飯', '肉絲炒飯', '蛋炒飯'], unitWeight: 350, defaultCount: 1, calories: 620, p: 18.0, c: 85.0, f: 22.0, fib: 2.0 },
  { names: ['炒麵', '肉絲炒麵'], unitWeight: 350, defaultCount: 1, calories: 580, p: 16.0, c: 80.0, f: 21.0, fib: 2.5 },
  { names: ['燙青菜'], unitWeight: 150, defaultCount: 1, calories: 65, p: 3.0, c: 6.0, f: 3.5, fib: 3.8 },

  // 湯品類
  { names: ['貢丸湯'], unitWeight: 350, defaultCount: 1, calories: 150, p: 8.5, c: 4.0, f: 11.0, fib: 0.5 },
  { names: ['酸辣湯'], unitWeight: 350, defaultCount: 1, calories: 180, p: 9.0, c: 16.0, f: 8.5, fib: 2.0 },
  { names: ['蛋花湯', '紫菜蛋花湯'], unitWeight: 350, defaultCount: 1, calories: 80, p: 6.5, c: 3.5, f: 4.5, fib: 1.0 },
  { names: ['味噌湯'], unitWeight: 300, defaultCount: 1, calories: 75, p: 5.5, c: 7.0, f: 2.8, fib: 1.0 },

  // 飲品與水 (嚴格限定完整品名，絕對禁止與其他食物模糊混淆)
  { names: ['水', '白開水', '氣泡水', '純水', '飲用水', '開水', '礦泉水'], unitWeight: 600, defaultCount: 1, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖綠茶', '日式綠茶'], unitWeight: 500, defaultCount: 1, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖烏龍茶', '凍頂烏龍'], unitWeight: 500, defaultCount: 1, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖紅茶'], unitWeight: 500, defaultCount: 1, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['無糖四季春', '四季春青茶', '四季春', '青茶', '高山茶', '麥茶', '無糖麥茶'], unitWeight: 500, defaultCount: 1, calories: 0, p: 0, c: 0, f: 0, fib: 0 },
  { names: ['黑咖啡', '美式咖啡', '美式黑咖啡', '美式'], unitWeight: 360, defaultCount: 1, calories: 5, p: 0.5, c: 0.8, f: 0.1, fib: 0 },
  { names: ['拿鐵咖啡', '無糖拿鐵', '拿鐵'], unitWeight: 360, defaultCount: 1, calories: 170, p: 8.5, c: 13.0, f: 9.5, fib: 0 },
  { names: ['高纖無糖豆漿', '無糖豆漿', '豆漿'], unitWeight: 400, defaultCount: 1, calories: 130, p: 13.6, c: 4.8, f: 6.4, fib: 3.2 },
  { names: ['低脂鮮奶', '鮮奶', '全脂鮮奶', '牛奶'], unitWeight: 290, defaultCount: 1, calories: 135, p: 9.0, c: 14.0, f: 4.5, fib: 0 },
  { names: ['燕麥奶'], unitWeight: 300, defaultCount: 1, calories: 150, p: 3.0, c: 24.0, f: 4.5, fib: 2.0 },

  // 水果類
  { names: ['熟香蕉', '香蕉'], unitWeight: 140, defaultCount: 1, calories: 120, p: 1.5, c: 29.0, f: 0.2, fib: 2.5 },
  { names: ['蘋果'], unitWeight: 180, defaultCount: 1, calories: 95, p: 0.5, c: 25.0, f: 0.3, fib: 4.0 },
  { names: ['芭樂', '珍珠芭樂'], unitWeight: 200, defaultCount: 1, calories: 76, p: 1.6, c: 18.0, f: 0.2, fib: 6.0 },
  { names: ['奇異果'], unitWeight: 100, defaultCount: 1, calories: 60, p: 1.2, c: 14.5, f: 0.5, fib: 3.0 },
  { names: ['小番茄', '聖女小番茄'], unitWeight: 150, defaultCount: 1, calories: 45, p: 1.5, c: 9.5, f: 0.3, fib: 2.2 },
  { names: ['木瓜'], unitWeight: 200, defaultCount: 1, calories: 80, p: 1.0, c: 19.5, f: 0.2, fib: 3.0 },

  // 全穀雜糧與主食
  { names: ['烤地瓜', '蒸地瓜', '地瓜'], unitWeight: 150, defaultCount: 1, calories: 180, p: 2.0, c: 42.0, f: 0.3, fib: 3.8 },
  { names: ['白飯一碗', '白米飯', '白飯'], unitWeight: 200, defaultCount: 1, calories: 280, p: 5.0, c: 60.0, f: 0.6, fib: 1.0 },
  { names: ['白飯半碗', '半碗飯'], unitWeight: 100, defaultCount: 1, calories: 140, p: 2.5, c: 30.0, f: 0.3, fib: 0.5 },
  { names: ['糙米飯', '五穀飯', '紫米飯'], unitWeight: 180, defaultCount: 1, calories: 240, p: 5.5, c: 50.0, f: 1.8, fib: 3.5 },
  { names: ['燕麥片', '大燕麥片'], unitWeight: 50, defaultCount: 1, calories: 190, p: 6.5, c: 33.0, f: 4.0, fib: 4.5 },
  { names: ['全麥吐司'], unitWeight: 40, defaultCount: 1, calories: 105, p: 4.0, c: 19.0, f: 1.5, fib: 2.0 },
  { names: ['白吐司'], unitWeight: 40, defaultCount: 1, calories: 115, p: 3.5, c: 22.0, f: 1.5, fib: 0.8 },
  { names: ['御飯糰', '鮪魚飯糰', '肉鬆飯糰'], unitWeight: 110, defaultCount: 1, calories: 210, p: 5.5, c: 38.0, f: 3.8, fib: 1.0 },

  // 常見超商零食點心
  { names: ['孔雀捲心餅'], unitWeight: 63, defaultCount: 1, calories: 330, p: 3.5, c: 42.0, f: 16.5, fib: 1.0 },
  { names: ['義美小泡芙'], unitWeight: 65, defaultCount: 1, calories: 380, p: 4.5, c: 41.0, f: 22.0, fib: 1.0 },
  { names: ['洋芋片'], unitWeight: 50, defaultCount: 1, calories: 270, p: 3.0, c: 28.0, f: 16.5, fib: 1.5 },
  { names: ['黑巧克力 (70%以上)', '黑巧克力'], unitWeight: 30, defaultCount: 1, calories: 175, p: 2.5, c: 13.0, f: 12.5, fib: 3.0 }
];

/**
 * 完整字詞與份量解析防呆工具
 * 分離輸入中的份量數量 (顆、個、g、碗) 與純食物核心詞彙 (baseName)
 */
export function extractQuantityAndBaseName(input) {
  if (!input || typeof input !== 'string') return { baseName: '', weight: null, count: null };
  const text = input.trim();
  let weight = null;
  let count = null;

  // 1. 解析指定克數/毫升 (例: 63g, 150克, 200ml, 500毫升)
  const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|克|ml|毫升|公克)/i);
  if (gMatch) {
    weight = parseFloat(gMatch[1]);
  }

  // 2. 解析數量 (顆、個、隻、碗、份、片、條)
  const cnNums = { '一': 1, '兩': 2, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '半': 0.5 };
  
  const countDigitMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:顆|個|隻|條|片|碗|份|杯|罐|瓶|盤|盒|包|串|卷)/);
  if (countDigitMatch) {
    count = parseFloat(countDigitMatch[1]);
  } else {
    const countCnMatch = text.match(/([一兩二三四五六七八九十半])\s*(?:顆|個|隻|條|片|碗|份|杯|罐|瓶|盤|盒|包|串|卷)/);
    if (countCnMatch && cnNums[countCnMatch[1]]) {
      count = cnNums[countCnMatch[1]];
    }
  }

  // 3. 清理出純食物名稱 (過濾掉數字、數量單位、括號等)
  let baseName = text
    .replace(/(\d+(?:\.\d+)?)\s*(?:g|克|ml|毫升|公克)/gi, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:顆|個|隻|條|片|碗|份|杯|罐|瓶|盤|盒|包|串|卷)/g, '')
    .replace(/([一兩二三四五六七八九十半])\s*(?:顆|個|隻|條|片|碗|份|杯|罐|瓶|盤|盒|包|串|卷)/g, '')
    .replace(/[約大約約莫共]/g, '')
    .replace(/[\(\)（）\[\]【】]/g, '')
    .trim();

  return { baseName: baseName || text, weight, count };
}

/**
 * 嚴謹完整詞彙比對防呆函數
 * 核心規則：
 * 1. 單一字元（如「水」、「蛋」、「茶」、「肉」、「麵」）必須完全相等 (q === c)，嚴禁以模糊包含方式匹配！
 * 2. 複合詞比對 (長度 >= 2)：支援全等或語意明確的子字串比對 (例: "高麗菜水餃" 匹配 "水餃")
 */
export function matchFoodName(queryBase, candidateName) {
  const q = (queryBase || '').toLowerCase().trim();
  const c = (candidateName || '').toLowerCase().trim();

  if (!q || !c) return false;

  // 1. 完全精確相同
  if (q === c) return true;

  // 2. 關鍵防呆：單一字元絕對禁止模糊包含！
  // 例如 query 為「水餃」，candidate 為「水」 -> 絕對禁止吻合！
  // 例如 query 為「水」，candidate 為「水餃」 -> 絕對禁止吻合！
  if (q.length === 1 || c.length === 1) {
    return q === c;
  }

  // 3. 雙向複合詞包含比對 (長度皆 >= 2)
  // 例：「高麗菜水餃」包含「水餃」➔ 吻合
  // 例：「水餃」被「韭菜水餃」包含 ➔ 吻合
  // 例：「無糖綠茶」包含「綠茶」➔ 吻合
  if (q.includes(c) || c.includes(q)) {
    return true;
  }

  return false;
}

/**
 * 從使用者輸入文字中解析數量/重量，並對照本地資料庫
 * @param {string} text 
 * @param {Array} pastMeals 
 */
export function fastLookupFood(text, pastMeals = []) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (!clean) return null;

  // 1. 解析指定克數/數量與核心食物名稱
  const { baseName, weight: parsedWeight, count: parsedCount } = extractQuantityAndBaseName(clean);
  if (!baseName) return null;

  // 2. 優先比對使用者的歷史個人記錄 (Personal History Matching)
  if (pastMeals && pastMeals.length > 0) {
    // 優先：完全精確比對
    for (const m of pastMeals) {
      const histName = (m.foodName || '').trim();
      if (!histName) continue;
      const histBase = extractQuantityAndBaseName(histName).baseName;

      if (histBase && baseName === histBase) {
        return buildResultFromMeal(m, baseName, parsedWeight, parsedCount);
      }
    }

    // 次之：長度 >= 2 的複合詞嚴謹比對
    for (const m of pastMeals) {
      const histName = (m.foodName || '').trim();
      if (!histName) continue;
      const histBase = extractQuantityAndBaseName(histName).baseName;

      if (histBase && matchFoodName(baseName, histBase)) {
        return buildResultFromMeal(m, histName, parsedWeight, parsedCount);
      }
    }
  }

  // 3. 比對常見台灣食物資料庫 (Common Taiwan Foods)
  // 按照候選詞長度降冪排序，確保具體詞彙優先於通用詞彙 (例: "高麗菜水餃" 優先於 "水餃")
  const sortedDict = [...COMMON_TAIWAN_FOODS].sort((a, b) => {
    const maxA = Math.max(...a.names.map(n => n.length));
    const maxB = Math.max(...b.names.map(n => n.length));
    return maxB - maxA;
  });

  for (const item of sortedDict) {
    const matchedName = item.names.find(n => matchFoodName(baseName, n));
    if (matchedName) {
      const unitW = item.unitWeight || 100;
      const defaultCnt = item.defaultCount || 1;
      const effectiveCount = parsedCount !== null ? parsedCount : defaultCnt;
      
      const targetW = parsedWeight !== null 
        ? parsedWeight 
        : (unitW * effectiveCount);
      
      const ratio = targetW / unitW;

      const cal = Math.round(item.calories * ratio);
      const p = Math.round((item.p * ratio) * 10) / 10;
      const c = Math.round((item.c * ratio) * 10) / 10;
      const f = Math.round((item.f * ratio) * 10) / 10;
      const fib = Math.round((item.fib * ratio) * 10) / 10;

      const countLabel = parsedCount !== null ? `${parsedCount}顆/份` : (item.defaultCount > 1 ? `${item.defaultCount}顆/份` : '');

      return {
        isMock: false,
        food_name: baseName || matchedName,
        estimated_weight_g: Math.round(targetW),
        calories: cal,
        macros: { protein_g: p, carbs_g: c, fat_g: f, fiber_g: fib },
        ingredients: [{ name: matchedName, weight_g: Math.round(targetW), calories: cal }],
        confidence_note: `⚡ 0.01秒極速查表完成 (台灣常見食品資料庫・${matchedName}${countLabel ? ' ' + countLabel : ''})`
      };
    }
  }

  return null;
}

function buildResultFromMeal(m, matchLabel, parsedWeight, parsedCount) {
  const baseW = Number(m.estimatedWeightG) || 100;
  const countMult = parsedCount !== null ? parsedCount : 1;
  const targetW = parsedWeight !== null ? parsedWeight : (baseW * countMult);
  const ratio = targetW / baseW;

  const cal = Math.round(Number(m.calories || 0) * ratio);
  const p = Math.round((Number(m.macros?.proteinG || 0) * ratio) * 10) / 10;
  const c = Math.round((Number(m.macros?.carbsG || 0) * ratio) * 10) / 10;
  const f = Math.round((Number(m.macros?.fatG || 0) * ratio) * 10) / 10;
  const fib = Math.round((Number(m.macros?.fiberG || 0) * ratio) * 10) / 10;

  return {
    isMock: false,
    food_name: m.foodName || matchLabel,
    estimated_weight_g: Math.round(targetW),
    calories: cal,
    macros: { protein_g: p, carbs_g: c, fat_g: f, fiber_g: fib },
    ingredients: m.ingredients || [{ name: m.foodName, weight_g: Math.round(targetW), calories: cal }],
    confidence_note: `⚡ 0.01秒極速比對個人歷史記錄 (${m.foodName})`
  };
}
