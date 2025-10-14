document.addEventListener("DOMContentLoaded", () => {
  // Auto-fill today's date
  const dateField = document.getElementById("date");
  if (dateField && !dateField.value) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyy = today.getFullYear();
    dateField.value = `${mm}/${dd}/${yyyy}`;
  }

  const saveBtn = document.getElementById("saveBtn");
  const savedRounds = document.getElementById("savedRounds");
  if (!savedRounds) return;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function calculateCumulativeHandicap() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_"));
    const handicaps = [];
    keys.forEach(key => {
      const round = localStorage.getItem(key);
const scoreMatch = round.match(/Score: (\\d+)/);
const slopeMatch = round.match(/Slope: (\\d+)/);
if (scoreMatch && slopeMatch) {
  const score = parseFloat(scoreMatch[1]);
  const slope = parseFloat(slopeMatch[1]);

        if (!isNaN(score) && !isNaN(slope) && slope !== 0) {
          const scaled = ((score - 72) / slope) * 113;
          const h = Math.max(0, Math.min(scaled, 36));
          handicaps.push(h);
        }
      }
    });
    const handicapField = document.getElementById("handicap");
    if (handicapField) {
      if (handicaps.length > 0) {
        const avg = handicaps.reduce((a, b) => a + b, 0) / handicaps.length;
        handicapField.value = avg.toFixed(1);
      } else {
        handicapField.value = "—";
      }
    }
  }

  function displayRounds() {
    savedRounds.innerHTML = "<h2>Saved Rounds</h2>";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_")).sort().reverse();
    keys.forEach(key => {
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
            calculateCumulativeHandicap();
          }
        });
      }
    });
    calculateCumulativeHandicap();
  }

  function saveRound() {
    const date = document.getElementById("date")?.value || "";
    const course = document.getElementById("course")?.value || "";
    const scoreVal = parseFloat(document.getElementById("score")?.value || "");
    const slopeVal = parseFloat(document.getElementById("slope")?.value || "");
    const yardage = document.getElementById("yardage")?.value || "";
    const notes = document.getElementById("notes")?.value || "";
    // 🔴 Mandatory field check
if (!course || isNaN(scoreVal) || isNaN(slopeVal)) {
  alert("Please enter Course, Score, and Slope before saving.");
  return;
}


    // 🔴 Mandatory field check
    if (!course || isNaN(scoreVal) || isNaN(slopeVal)) {
      alert("Please enter Course, Score, and Slope before saving.");
      return;
    }

    let handicapVal = "";
    if (!isNaN(scoreVal) && !isNaN(slopeVal) && slopeVal !== 0) {
      const scaled = ((scoreVal - 72) / slopeVal) * 113;
      handicapVal = Math.max(0, Math.min(scaled, 36)).toFixed(1);
    }

    const round = `${date} — ${course} | Score: ${scoreVal}, Slope: ${slopeVal}, Yardage: ${yardage} | ${notes}`;

    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem("round_" + timestamp, round);
    } catch (err) {
      console.warn("localStorage write failed", err);
    }

    displayRounds();

    const form = document.getElementById("roundForm") || document.querySelector("form");
    if (form) try { form.reset(); } catch (e) {}

    // Refill date after reset
    const dateField = document.getElementById("date");
    if (dateField) {
      try {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const yyyy = today.getFullYear();
        dateField.value = `${mm}/${dd}/${yyyy}`;
        dateField.focus();
        if (dateField.setSelectionRange) dateField.setSelectionRange(0, 0);
      } catch (e) {}
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveRound();
    });
  }

  displayRounds();
});
