update 2025
document.addEventListener("DOMContentLoaded", () => {
  // helper
  const $id = id => document.getElementById(id) || null;

  // Autofill today's date in mm/dd/yyyy if empty
  function autofillDateIfEmpty() {
    const dateField = $id("date");
    if (!dateField) return;
    if (String(dateField.value || "").trim() === "") {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      dateField.value = `${mm}/${dd}/${yyyy}`;
    }
  }

  // Initialize autofill immediately
  autofillDateIfEmpty();

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

  // Clear inputs but preserve date and handicap
  function clearFormInputs(form) {
    if (!form) return;
    Array.from(form.elements).forEach(el => {
      if (!el) return;
      const tid = (el.id || "").toLowerCase();
      if (tid === "handicap" || tid === "date") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = "";
      else if (el.tagName === "SELECT") el.selectedIndex = 0;
    });
  }

  // Save, update UI immediately, append handicap to saved string, keep date
  function saveRoundAndRefreshUI() {
    autofillDateIfEmpty(); // ensure date present before validating
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

    // store round first so handicap calculation includes it
    localStorage.setItem(key, baseStored);

    // immediate UI update
    displayRounds();
    calculateCumulativeHandicap();

    // append current handicap into stored string after a tiny delay to avoid mobile focus races
    setTimeout(() => {
      const handicapField = $id("handicap");
      const currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";
      const storedWithHandicap = `${baseStored}, Handicap: ${currentHandicap}`;
      localStorage.setItem(key, storedWithHandicap);

      // re-render so the saved-round shows the handicap immediately
      displayRounds();

      // clear other inputs but keep date and handicap visible
      clearFormInputs($id("roundForm"));

      // ensure date autofill remains if anything cleared it
      autofillDateIfEmpty();

      // final defensive recalculation
      setTimeout(() => calculateCumulativeHandicap(), 40);
    }, 40);
  }

  if (saveBtn) saveBtn.addEventListener("click", saveRoundAndRefreshUI);

  // initial render
  displayRounds();
  calculateCumulativeHandicap();

  // recalc when returning to the tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      autofillDateIfEmpty();
      calculateCumulativeHandicap();
      displayRounds();
    }
  });
});
