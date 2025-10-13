// script.js — Golf Log HandicapTest (mobile-safe, autofill, clear, delete)
document.addEventListener('DOMContentLoaded', () => {
  // Autofill today's date if visible and empty
  const dateFields = document.querySelectorAll("#date");
  for (const el of dateFields) {
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== "none" && style.visibility !== "hidden" && el.offsetHeight > 0;
    if (isVisible && !el.value) {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const yyyy = today.getFullYear();
      el.value = `${mm}/${dd}/${yyyy}`;
      break;
    }
  }

  const saveBtn = document.getElementById("saveBtn");
  const savedRounds = document.getElementById("savedRounds");
  const dateInput = document.getElementById("date");
  const courseInput = document.getElementById("course");
  const scoreInput = document.getElementById("score");
  const slopeInput = document.getElementById("slope");
  const handicapInput = document.getElementById("handicap");
  const notesInput = document.getElementById("notes");

  if (!dateInput || !courseInput) {
    console.error("Missing #date or #course input — check IDs in HTML");
    return;
  }

  // Enter on Date advances to Course
  dateInput.addEventListener("keydown", e => {
    const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
    if (!isEnter || document.activeElement !== dateInput) return;
    e.preventDefault(); e.stopPropagation();
    setTimeout(() => courseInput.focus(), 0);
  });

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function displayRounds() {
    savedRounds.innerHTML = "<h2>Saved Rounds</h2>";
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("round_")) keys.push(key);
    }
    keys.sort().reverse();
    for (const key of keys) {
      const round = localStorage.getItem(key) || "";
      const entry = document.createElement("div");
      entry.className = "round-entry";
      entry.innerHTML = `
        <span class="round-text">${escapeHtml(round)}</span>
        <button class="delete-btn" data-key="${key}" title="Delete this round">×</button>
      `;
      savedRounds.appendChild(entry);
      const del = entry.querySelector(".delete-btn");
      if (del) {
        del.addEventListener("click", function () {
          const keyToDelete = this.getAttribute("data-key");
          if (keyToDelete) {
            localStorage.removeItem(keyToDelete);
            displayRounds();
          }
        });
      }
    }
  }

  function clearInputs() {
    const form = document.getElementById("roundForm") || document.querySelector("form");
    if (form) try { form.reset(); } catch (e) {}
    const ids = ["date", "course", "score", "slope", "handicap", "notes"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        try {
          el.value = "";
          el.removeAttribute && el.removeAttribute('value');
          el.blur();
        } catch (e) {}
      }
    });
    setTimeout(() => {
      const dateField = document.getElementById("date");
      if (dateField) {
        try {
          dateField.focus();
          if (dateField.setSelectionRange) dateField.setSelectionRange(0, 0);
        } catch (e) {}
      }
    }, 150);
  }

  function saveRound() {
    const date = dateInput.value || "";
    const course = courseInput.value || "";
    const score = scoreInput.value || "";
    const slope = slopeInput.value || "";
    const handicap = handicapInput.value || "";
    const notes = notesInput.value || "";

    const round = `${date} — ${course} | Score: ${score}, Slope: ${slope}, Handicap: ${handicap} | ${notes}`;
    const timestamp = new Date().toISOString();

    try {
      localStorage.setItem("round_" + timestamp, round);
    } catch (err) {
      console.warn("localStorage write failed", err);
    }

    displayRounds();
    clearInputs();
  }

  if (saveBtn) saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    saveRound();
  });

  displayRounds();
});
function calculateDifferential() {
  const score = parseFloat(document.getElementById('score').value);
  const courseRating = parseFloat(document.getElementById('courseRating').value);
  const slopeRating = parseFloat(document.getElementById('slopeRating').value);

  if (isNaN(score) || isNaN(courseRating) || isNaN(slopeRating) || slopeRating === 0) {
    document.getElementById('differentialOutput').textContent = 'Invalid input';
    return;
  }

  const differential = ((score - courseRating) * 113) / slopeRating;
  document.getElementById('differentialOutput').textContent = differential.toFixed(1);
}
