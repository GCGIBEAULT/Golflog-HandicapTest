document.addEventListener("DOMContentLoaded", () => {
  // Defensive helper to find an element and return null if not present
  function $id(id) { return document.getElementById(id) || null; }

  // Auto-fill today's date in mm/dd/yyyy if the date field exists and is empty
  (function autofillDate() {
    const dateField = $id("date");
    if (!dateField) return;
    // If value already present, do nothing
    if (String(dateField.value || "").trim() !== "") return;
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yyyy = today.getFullYear();
    dateField.value = `${mm}/${dd}/${yyyy}`;
  })();

  const saveBtn = $id("saveBtn");
  const savedRounds = $id("savedRounds");

  if (!savedRounds) {
    console.error("savedRounds element missing");
    return;
  }

  function escapeHtml(s) {
    return String(s || "")
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

    const handicapField = $id("handicap");
    if (!handicapField) return;

    if (handicaps.length === 0) {
      handicapField.value = "—";
      return;
    }

    const recent = handicaps.slice(-20);
    const sum = recent.reduce((a, b) => a + b, 0);
    const avg = sum / recent.length;
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
      if (el.id === "handicap" || el.name === "handicap") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        // avoid clearing date auto-fill if the user expects it to remain filled
        if (el.id === "date") el.value = ""; // keep behavior consistent with previous UX; adjust if you want to preserve date
        else el.value = "";
      } else if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      }
    });
  }

  // Save round, recalc handicap, append current handicap into the saved string
  function saveRoundAndRefreshUI() {
    const date = $id("date")?.value || "";
    const score = $id("score")?.value || "";
    const slope = $id("slope")?.value || "";
    const yardage = $id("yardage")?.value || "";
    const notes = $id("notes")?.value || "";

    if (!date || !score || !slope) {
      alert("Please fill Date, Score and Slope before saving.");
      return;
    }

    const key = `round_${Date.now()}`;
    const baseStored = `Date: ${date}, Score: ${score}, Slope: ${slope}, Yardage: ${yardage}, Notes: ${notes}`;

    // store without handicap first so calculateCumulativeHandicap includes this new round
    localStorage.setItem(key, baseStored);

    // update UI immediately
    displayRounds();
    calculateCumulativeHandicap();

    // read the freshly calculated handicap and append it to the saved item
    // tiny delay to avoid mobile focus/keyboard race conditions
    setTimeout(() => {
      const handicapField = $id("handicap");
      const currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";
      const storedWithHandicap = `${baseStored}, Handicap: ${currentHandicap}`;
      localStorage.setItem(key, storedWithHandicap);

      // re-render so the saved-round shows the handicap text immediately
      displayRounds();

      // clear inputs but protect handicap
      clearFormInputs($id("roundForm"));

      // defensive re-check for mobile race conditions
      setTimeout(() => {
        calculateCumulativeHandicap();
      }, 60);
    }, 40);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveRoundAndRefreshUI);
  }

  // initialize display and handicap on load
  displayRounds();
  calculateCumulativeHandicap();

  // recompute when returning to the tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) calculateCumulativeHandicap();
  });
});
