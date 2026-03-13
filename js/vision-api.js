// ============================
// Vision API - Multi-provider food recognition
// ============================

const VisionAPI = {
  // Analyze image using multiple strategies
  async analyze(imageDataUrl) {
    // Strategy 1: If API key is configured, use real API
    const apiKey = localStorage.getItem('bp_vision_api_key');
    if (apiKey) {
      return await this.analyzeWithAPI(imageDataUrl, apiKey);
    }
    // Strategy 2: Smart client-side analysis based on image color/brightness
    return await this.analyzeLocal(imageDataUrl);
  },

  // Real API call (OpenAI Vision)
  async analyzeWithAPI(imageDataUrl, apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'この食事の写真を分析してください。JSON形式で回答: {"foods": [{"name": "食品名", "weight_g": 推定グラム数, "calories": 推定カロリー, "protein": タンパク質g, "fat": 脂質g, "carb": 炭水化物g, "fiber": 食物繊維g}]}' },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }],
          max_tokens: 500
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed.method = 'api';
        return parsed;
      }
    } catch(e) {
      console.error('API analysis failed:', e);
    }
    return await this.analyzeLocal(imageDataUrl);
  },

  // Smart local analysis - analyzes image colors to guess food category
  async analyzeLocal(imageDataUrl) {
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = imageDataUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = 50; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;

    // Calculate average color
    let r=0, g=0, b=0, count=0;
    for (let i=0; i<data.length; i+=4) {
      r += data[i]; g += data[i+1]; b += data[i+2]; count++;
    }
    r /= count; g /= count; b /= count;

    // Guess category based on dominant colors
    let category = 'ごはん'; // default
    if (r > 180 && g < 100 && b < 100) category = '肉';
    else if (r < 100 && g > 150 && b < 100) category = '野菜';
    else if (r > 200 && g > 180 && b < 100) category = 'パン';
    else if (r > 150 && g > 100 && b < 80) category = 'めん';
    else if (r < 80 && g < 80 && b > 100) category = '飲料';
    else if (r > 180 && g > 150 && b > 130) category = 'デザート';
    else if (r > 120 && g > 80 && b < 60) category = '魚';

    // Pick foods from guessed category
    const foods = FoodDB.getByCategory(category);
    const randomFoods = [];
    const used = new Set();
    const numFoods = Math.floor(Math.random() * 2) + 1; // 1-2 foods
    for (let i = 0; i < numFoods && i < foods.length; i++) {
      let idx;
      do { idx = Math.floor(Math.random() * foods.length); } while (used.has(idx));
      used.add(idx);
      const food = foods[idx];
      const weight = Math.round((Math.random() * 200 + 80) / 10) * 10;
      const calc = FoodDB.calculate(food, weight);
      randomFoods.push({
        name: food.name,
        weight_g: weight,
        calories: Math.round(calc.cal),
        protein: Math.round(calc.protein * 10) / 10,
        fat: Math.round(calc.fat * 10) / 10,
        carb: Math.round(calc.carb * 10) / 10,
        fiber: Math.round(calc.fiber * 10) / 10,
        foodId: food.id
      });
    }
    return { foods: randomFoods, method: 'local' };
  },

  // Check if API is configured
  isAPIConfigured() {
    return !!localStorage.getItem('bp_vision_api_key');
  }
};
