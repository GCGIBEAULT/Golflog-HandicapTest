const rounds = [];
const handicapRounds = [];

function saveRound() {
  const score = parseFloat(document.getElementById('score').value);
  const slope = parseFloat(document.getElementById('slope').value);
  const course = document.getElementById('course').value;
  const date = document.getElementById('date').value;
  const notes = document.getElementById('notes').value;

  if (isNaN(score) || isNaN(slope) || slope === 0) return;

  const scaledHandicap = (score * 113) / slope;
  handicapRounds.push(scaledHandicap);

  rounds.push({ score, slope, scaledHandicap, course, date, notes });

  updateHandicapEstimate();
  displayRounds();
  clearInputs();
}

function updateHandicapEstimate() {
  if (handicapRounds.length === 0) return;

  const total = handicapRounds.reduce((sum, h) => sum + h, 0);
  const average = total / handicapRounds.length;

  document.getElementById('handicap').value = average.toFixed(1);
}

function displayRounds() {
  const container = document.getElementById('savedRounds');
  container.innerHTML = '';

  rounds.forEach((round, index) => {
    const div = document.createElement('div');
    div.className = 'round-entry';

    const text = document.createElement('div');
    text.className = 'round-text';
    text.textContent = `${round.date} — ${round.course} — Score: ${round.score} — Slope: ${round.slope} — Handicap: ${round.scaledHandicap.toFixed(1)}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => {
      rounds.splice(index, 1);
      handicapRounds.splice(index, 1);
      updateHandicapEstimate();
      displayRounds();
    };

    div.appendChild(text);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

function clearInputs() {
  document.getElementById('score').value = '';
  document.getElementById('slope').value = '';
  document.getElementById('course').value = '';
  document.getElementById('date').value = '';
  document.getElementById('notes').value = '';
}
