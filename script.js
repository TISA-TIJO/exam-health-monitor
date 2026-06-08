// ===== STATE =====
// This object holds all the current health metric values
const state = {
  sleep: 7,
  water: 1.5,
  study: 4,
  screen: 3,
  breaks: 2,
  stress: 5,
  mood: null
};

// ===== UPDATE METRIC =====
// Called whenever a slider is moved
function updateMetric(type, value) {
  value = parseFloat(value);

  if (type === 'sleep') {
    state.sleep = value;
    document.getElementById('sleepVal').textContent = value;
    document.getElementById('sleepBar').style.width = Math.round((value / 12) * 100) + '%';
  }
  else if (type === 'water') {
    state.water = value;
    document.getElementById('waterVal').textContent = value;
    document.getElementById('waterBar').style.width = Math.round((value / 4) * 100) + '%';
  }
  else if (type === 'study') {
    state.study = value;
    document.getElementById('studyVal').textContent = value;
    document.getElementById('studyBar').style.width = Math.round((value / 16) * 100) + '%';
  }
  else if (type === 'screen') {
    state.screen = value;
    document.getElementById('screenVal').textContent = value;
    document.getElementById('screenBar').style.width = Math.round((value / 16) * 100) + '%';
  }
  else if (type === 'break') {
    state.breaks = value;
    document.getElementById('breakVal').textContent = value;
    document.getElementById('breakBar').style.width = Math.round((value / 12) * 100) + '%';
  }
  else if (type === 'stress') {
    state.stress = value;
    document.getElementById('stressVal').textContent = value;
    document.getElementById('stressBar').style.width = Math.round((value / 10) * 100) + '%';
  }

  computeScore();
}

// ===== COMPUTE BURNOUT SCORE =====
function computeScore() {
  let score = 0;

  if (state.sleep < 4)       score += 35;
  else if (state.sleep < 6)  score += 20;
  else if (state.sleep < 7)  score += 10;

  if (state.water < 1)       score += 15;
  else if (state.water < 2)  score += 8;

  if (state.study > 12)      score += 25;
  else if (state.study > 8)  score += 12;

  if (state.screen > 10)     score += 15;
  else if (state.screen > 6) score += 8;

  if (state.breaks < 2)      score += 15;
  else if (state.breaks < 4) score += 5;

  score += Math.round((state.stress / 10) * 20);
  score = Math.max(0, Math.min(100, score));

  updateScoreUI(score);
}

// ===== UPDATE SCORE UI =====
function updateScoreUI(score) {
  const circle = document.getElementById('scoreCircle');
  const numEl  = document.getElementById('scoreNum');
  const badge  = document.getElementById('scoreBadge');
  const alertCard = document.getElementById('alertCard');

  numEl.textContent = score;
  const offset = 345 - (345 * score / 100);
  circle.style.strokeDashoffset = Math.round(offset);

  if (score <= 30) {
    circle.style.stroke = '#2e7d32';
    badge.textContent = 'Healthy';
    badge.className = 'score-badge';
    alertCard.classList.remove('show');
  } else if (score <= 60) {
    circle.style.stroke = '#f57c00';
    badge.textContent = 'Moderate Risk';
    badge.className = 'score-badge moderate';
    alertCard.classList.remove('show');
  } else if (score <= 80) {
    circle.style.stroke = '#e64a19';
    badge.textContent = 'High Risk';
    badge.className = 'score-badge high';
    alertCard.classList.remove('show');
  } else {
    circle.style.stroke = '#c62828';
    badge.textContent = 'Critical!';
    badge.className = 'score-badge critical';
    alertCard.classList.add('show');
  }
}

// ===== TABS =====
function switchTab(name, clickedBtn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  clickedBtn.classList.add('active');
}

// ===== MOOD =====
function selectMood(btn, mood) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.mood = mood;
}

// ===== POMODORO TIMER =====
let pomoSeconds = 25 * 60;
let pomoTotal   = 25 * 60;
let pomoInterval = null;
let pomoRunning  = false;

function togglePomo() {
  const btn = document.getElementById('pomoStartBtn');

  if (pomoRunning) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    btn.textContent = '▶ Resume';
  } else {
    pomoRunning = true;
    btn.textContent = '⏸ Pause';

    pomoInterval = setInterval(() => {
      if (pomoSeconds <= 0) {
        clearInterval(pomoInterval);
        pomoRunning = false;
        btn.textContent = '▶ Start';
        document.getElementById('pomoLabel').textContent = '🎉 Session complete! Take a 5-minute break.';
        return;
      }
      pomoSeconds--;
      const minutes = Math.floor(pomoSeconds / 60);
      const seconds = pomoSeconds % 60;
      document.getElementById('pomoTime').textContent =
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      const pct = Math.round((pomoSeconds / pomoTotal) * 100);
      document.getElementById('pomoFill').style.width = pct + '%';
    }, 1000);
  }
}

function resetPomo() {
  clearInterval(pomoInterval);
  pomoRunning  = false;
  pomoSeconds  = 25 * 60;
  document.getElementById('pomoTime').textContent  = '25:00';
  document.getElementById('pomoFill').style.width  = '100%';
  document.getElementById('pomoLabel').textContent = 'Focus session — 25 minutes';
  document.getElementById('pomoStartBtn').textContent = '▶ Start';
}

// ===== AI ADVICE (Google Gemini API - FREE) =====
async function getAIAdvice() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();

  if (!apiKey) {
    alert('Please enter your Google Gemini API key.\nGet it free at: aistudio.google.com');
    return;
  }

  const btn    = document.getElementById('aiBtn');
  const loading = document.getElementById('loadingDots');
  const recList = document.getElementById('recList');

  btn.disabled = true;
  btn.textContent = 'Analyzing your health data...';
  loading.style.display = 'flex';
  recList.innerHTML = '';

  const score  = document.getElementById('scoreNum').textContent;
  const prompt = `You are a student wellness AI assistant. A student has these health metrics during exams:
- Sleep: ${state.sleep} hours
- Water: ${state.water} litres
- Study time: ${state.study} hours
- Screen time: ${state.screen} hours
- Breaks: ${state.breaks}
- Stress: ${state.stress}/10
- Mood: ${state.mood || 'Not specified'}
- Burnout score: ${score}/100

Give exactly 4 short actionable wellness tips. Return ONLY a JSON array of 4 strings. No markdown, no explanation. Example: ["tip1","tip2","tip3","tip4"]`;

  try {
    // Using gemini-2.0-flash-lite — free and fast
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    });

    const data = await response.json();

    // Check if API returned an error
    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    // Extract the text from Gemini's response
    const raw = data.candidates[0].content.parts[0].text
      .replace(/```json|```/g, '')
      .trim();

    // Find the JSON array in the response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Bad response format');

    const recommendations = JSON.parse(jsonMatch[0]);
    const colors = ['#26a69a', '#42a5f5', '#7986cb', '#ffa726'];

    recList.innerHTML = recommendations.map((rec, i) =>
      `<li class="rec-item">
        <span class="rec-dot" style="background:${colors[i % 4]}"></span>
        <span>${rec}</span>
      </li>`
    ).join('');

  } catch (error) {
    // Show helpful error messages based on what went wrong
    let msg = 'Something went wrong. ';
    const errText = error.message || '';

    if (errText.includes('API_KEY_INVALID') || errText.includes('invalid') || errText.includes('400')) {
      msg = 'API key is invalid. Please copy it again carefully from aistudio.google.com.';
    } else if (errText.includes('quota') || errText.includes('429')) {
      msg = 'Free daily quota exceeded. Please try again tomorrow — it resets every 24 hours.';
    } else if (errText.includes('fetch') || errText.includes('network')) {
      msg = 'Network error. Please check your internet connection and try again.';
    } else {
      msg = 'Error: ' + errText + '. Check your API key and try again.';
    }

    recList.innerHTML = `<li class="rec-item">
      <span class="rec-dot" style="background:#ef5350"></span>
      <span>${msg}</span>
    </li>`;
    console.error('Gemini API Error:', errText);
  }

  btn.disabled = false;
  btn.textContent = '✨ Get AI Advice';
  loading.style.display = 'none';
}

// ===== INIT =====
computeScore();
