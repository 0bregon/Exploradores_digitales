// Exploradores Digitales - interacciones de las actividades
// Todo el estado vive en memoria (sin localStorage) por simplicidad.

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- Matching game (Descubre) ---------------- */
function initMatching(containerId, pairs) {
  const el = document.getElementById(containerId);
  const left = shuffle(pairs.map((p, i) => ({ i, emoji: p.emoji })));
  const right = shuffle(pairs.map((p, i) => ({ i, label: p.label })));

  el.innerHTML = `
    <div class="match-wrap">
      <div class="match-col" id="${containerId}-left"></div>
      <div class="match-col" id="${containerId}-right"></div>
    </div>
    <p class="feedback" id="${containerId}-fb"></p>
  `;
  const leftCol = document.getElementById(`${containerId}-left`);
  const rightCol = document.getElementById(`${containerId}-right`);
  const fb = document.getElementById(`${containerId}-fb`);

  let selectedLeft = null;
  let matched = 0;

  left.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerHTML = `<span class="emoji">${item.emoji}</span>`;
    card.dataset.i = item.i;
    card.addEventListener('click', () => {
      if (card.classList.contains('correct')) return;
      leftCol.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedLeft = card;
    });
    leftCol.appendChild(card);
  });

  right.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.textContent = item.label;
    card.dataset.i = item.i;
    card.addEventListener('click', () => {
      if (card.classList.contains('correct') || !selectedLeft) return;
      if (selectedLeft.dataset.i === card.dataset.i) {
        selectedLeft.classList.remove('selected');
        selectedLeft.classList.add('correct');
        card.classList.add('correct');
        selectedLeft = null;
        matched++;
        if (matched === pairs.length) {
          fb.textContent = '¡Genial! Emparejaste todo correctamente. 🎉';
          fb.className = 'feedback ok';
        }
      } else {
        card.classList.add('wrong');
        selectedLeft.classList.add('wrong');
        setTimeout(() => {
          card.classList.remove('wrong');
          selectedLeft && selectedLeft.classList.remove('wrong', 'selected');
        }, 400);
        selectedLeft = null;
      }
    });
    rightCol.appendChild(card);
  });
}

/* ---------------- Order list (Lista desordenada) ---------------- */
function initOrder(containerId, steps) {
  const el = document.getElementById(containerId);
  let order = shuffle(steps.map((s, i) => i));

  function render() {
    el.innerHTML = `
      <ul class="order-list" id="${containerId}-list"></ul>
      <button class="btn" id="${containerId}-check">Comprobar</button>
      <p class="feedback" id="${containerId}-fb"></p>
    `;
    const list = document.getElementById(`${containerId}-list`);
    order.forEach((stepIndex, pos) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${steps[stepIndex]}</span>
        <span class="step-buttons">
          <button data-dir="-1" ${pos === 0 ? 'disabled' : ''}>↑</button>
          <button data-dir="1" ${pos === order.length - 1 ? 'disabled' : ''}>↓</button>
        </span>`;
      li.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = parseInt(btn.dataset.dir, 10);
          const newPos = pos + dir;
          if (newPos < 0 || newPos >= order.length) return;
          [order[pos], order[newPos]] = [order[newPos], order[pos]];
          render();
        });
      });
      list.appendChild(li);
    });
    document.getElementById(`${containerId}-check`).addEventListener('click', () => {
      const fb = document.getElementById(`${containerId}-fb`);
      const items = list.querySelectorAll('li');
      let allCorrect = true;
      order.forEach((stepIndex, pos) => {
        const ok = stepIndex === pos;
        items[pos].classList.remove('correct', 'wrong');
        items[pos].classList.add(ok ? 'correct' : 'wrong');
        if (!ok) allCorrect = false;
      });
      fb.textContent = allCorrect ? '¡Correcto! 🎉' : 'Todavía no... revisa el orden marcado en rojo.';
      fb.className = 'feedback ' + (allCorrect ? 'ok' : 'bad');
    });
  }
  render();
}

/* ---------------- Classify (Clasifica) ---------------- */
function initClassify(containerId, items, groupNames) {
  const el = document.getElementById(containerId);
  const shuffled = shuffle(items.map((it, i) => ({ ...it, i })));
  let selected = null;
  const placement = {}; // i -> groupIndex

  el.innerHTML = `
    <div class="classify-pool" id="${containerId}-pool"></div>
    <div class="classify-groups">
      ${groupNames.map((g, gi) => `<div class="classify-group" id="${containerId}-group-${gi}"><h3>${g}</h3><div class="classify-group-items"></div></div>`).join('')}
    </div>
    <button class="btn" id="${containerId}-check">Comprobar</button>
    <p class="feedback" id="${containerId}-fb"></p>
  `;
  const pool = document.getElementById(`${containerId}-pool`);

  function makeCard(item) {
    const card = document.createElement('div');
    card.className = 'classify-card';
    card.textContent = item.label;
    card.dataset.i = item.i;
    card.addEventListener('click', () => {
      if (card.dataset.placed) return; // already placed, locked until reset
      pool.querySelectorAll('.classify-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = card;
    });
    return card;
  }

  shuffled.forEach(item => pool.appendChild(makeCard(item)));

  groupNames.forEach((g, gi) => {
    const groupEl = document.getElementById(`${containerId}-group-${gi}`);
    groupEl.addEventListener('click', (e) => {
      if (!selected || e.target.closest('.classify-card')) return;
      const targetList = groupEl.querySelector('.classify-group-items');
      targetList.appendChild(selected);
      selected.dataset.placed = gi;
      placement[selected.dataset.i] = gi;
      selected.classList.remove('selected');
      selected = null;
    });
  });

  document.getElementById(`${containerId}-check`).addEventListener('click', () => {
    const fb = document.getElementById(`${containerId}-fb`);
    let allPlaced = true, allCorrect = true;
    items.forEach((item, i) => {
      const cardGroup = placement[i];
      if (cardGroup === undefined) { allPlaced = false; return; }
      const card = el.querySelector(`.classify-card[data-i="${i}"]`);
      const ok = cardGroup === item.group;
      card.classList.remove('correct', 'wrong');
      card.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) allCorrect = false;
    });
    if (!allPlaced) {
      fb.textContent = 'Coloca todas las tarjetas antes de comprobar.';
      fb.className = 'feedback bad';
    } else {
      fb.textContent = allCorrect ? '¡Perfecto, todo bien clasificado! 🎉' : 'Algunas tarjetas están en el grupo equivocado (en rojo).';
      fb.className = 'feedback ' + (allCorrect ? 'ok' : 'bad');
    }
  });
}

/* ---------------- Quiz (Selecciona) ---------------- */
function initQuiz(containerId, questions) {
  const el = document.getElementById(containerId);
  el.innerHTML = questions.map((q, qi) => `
    <div class="quiz-question">
      <p class="q">${qi + 1}. ${q.question}</p>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <label>
            <input type="radio" name="${containerId}-q${qi}" value="${oi}">
            ${opt}
          </label>`).join('')}
      </div>
    </div>
  `).join('') + `<button class="btn" id="${containerId}-check">Comprobar</button><p class="feedback" id="${containerId}-fb"></p>`;

  document.getElementById(`${containerId}-check`).addEventListener('click', () => {
    let score = 0;
    questions.forEach((q, qi) => {
      const labels = el.querySelectorAll(`input[name="${containerId}-q${qi}"]`);
      let chosen = -1;
      labels.forEach((inp, oi) => { if (inp.checked) chosen = oi; });
      labels.forEach((inp, oi) => {
        const label = inp.closest('label');
        label.classList.remove('correct', 'wrong');
        if (oi === q.correct) label.classList.add('correct');
        else if (oi === chosen) label.classList.add('wrong');
      });
      if (chosen === q.correct) score++;
    });
    const fb = document.getElementById(`${containerId}-fb`);
    fb.textContent = `Obtuviste ${score} de ${questions.length} correctas.`;
    fb.className = 'feedback ' + (score === questions.length ? 'ok' : 'bad');
  });
}

/* ---------------- Flashcards (reemplazo de la sopa de letras) ---------------- */
function initFlashcards(containerId, cards) {
  const el = document.getElementById(containerId);
  el.innerHTML = `<div class="flash-grid" id="${containerId}-grid"></div>`;
  const grid = document.getElementById(`${containerId}-grid`);
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'flash-card';
    div.textContent = c.definition;
    div.dataset.flipped = 'false';
    div.addEventListener('click', () => {
      const flipped = div.dataset.flipped === 'true';
      div.dataset.flipped = flipped ? 'false' : 'true';
      div.textContent = flipped ? c.definition : c.word;
      div.classList.toggle('flipped', !flipped);
    });
    grid.appendChild(div);
  });
            }
