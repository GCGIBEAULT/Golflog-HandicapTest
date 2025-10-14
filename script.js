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
      .replace(/\&/g, "&amp;")
      .replace(/\</g, "&lt;")
      .replace(/\>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/\'/g, "&#39;");
  }

  function calculateCumulativeHandicap() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_"));
    const handicaps = [];

    keys.forEach(key => {
      const round = localStorage.getItem(key);
      console.log("round raw:", JSON.stringify(round));
      if (!round) return;

      // tolerant extraction: find Score and Slope anywhere in the string
      const scoreMatch = round.match(/Score:\s*(\d+)/);
      const slopeMatch = round.match(/Slope:\s*(\d+)/);
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
    if (!handicapField) return;

    if (handicaps.length === 0) {
      handicapField.value = "—";
      return;
    }

    // take mean of most recent 20 rounds (or fewer if not available)
    const recent = handicaps.slice(-20);
    const sum = recent.reduce((a, b) => a + b, 0);
    const avg = sum / recent.length;
    // round to one decimal place
    handicapField.value = (Math.round(avg * 10) / 10).toFixed(1);
  }

  function displayRounds() {
    savedRounds.innerHTML = "";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_")).sort();
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      const li = document.createElement("li");
      li.innerHTML = `<span class="round-text">${escapeHtml(value || "")}</span>
                      <button class="delete-btn" data-key="${escapeHtml(key)}" aria-label="Delete round">&times;</button>`;
      savedRounds.appendChild(li);
    });

    // attach delete handlers
    savedRounds.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.getAttribute("data-key");
        if (k) {
          localStorage.removeItem(k);
          displayRounds();
          calculateCumulativeHandicap();
        }
      });
    });
  }

  function clearFormInputs(form) {
    if (!form) return;
    Array.from(form.elements).forEach(el => {
      // keep the handicap field intact
      if (el.id === "handicap") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = "";
      } else if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const date = document.getElementById("date")?.value || "";
      const score = document.getElementById("score")?.value || "";
      const slope = document.getElementById("slope")?.value || "";
      const yardage = document.getElementById("yardage")?.value || "";
      const notes = document.getElementById("notes")?.value || "";

      // required fields guard (mandatory entries)
      if (!date || !score || !slope) {
        alert("Please fill Date, Score and Slope before saving.");
        return;
      }

      const key = `round_${Date.now()}`;
      // store a stable, parseable string
      const stored = `Date: ${date}, Score: ${score}, Slope: ${slope}, Yardage: ${yardage}, Notes: ${notes}`;
      localStorage.setItem(key, stored);

      displayRounds();
      calculateCumulativeHandicap();
      clearFormInputs(document.getElementById("roundForm"));
    });
  }

  // initialize display and handicap on load
  displayRounds();
  calculateCumulativeHandicap();
});
