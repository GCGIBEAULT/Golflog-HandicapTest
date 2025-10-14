document.addEventListener("DOMContentLoaded", () => {
  const $id = id => document.getElementById(id) || null;

  // Autofill today's date in mm/dd/yyyy if empty and force UI update on mobile
  function autofillDateIfEmpty() {
    const dateField = $id("date");
    if (!dateField) return;
    if (String(dateField.value || "").trim() === "") {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      dateField.value = `${mm}/${dd}/${yyyy}`;
      // force some mobile browsers to visually commit the programmatic value
      dateField.dispatchEvent(new Event("input", { bubbles: true }));
      dateField.blur();
    }
  }

  // Run autofill on load
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

  // Corrected regex uses \d+ (not escaped unicode sequence)
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
  const container = document.getElementById("roundsContainer");
  if (!container) return;

  container.innerHTML = ""; // clear previous

  const keys = Object.keys(localStorage).filter(k => k.startsWith("round_")).sort().reverse();
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    const div = document.createElement("div");
    div.className = "round-entry";

    // Extract Course Name
    const courseMatch = data.match(/Course:\s*([^,]+)/i);
    const courseName = courseMatch ? courseMatch[1].trim() : "Unknown Course";

    div.textContent = `🏌️‍♂️ ${courseName} — ${data}`;
    container.appendChild(div);
  });
}


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

  // Save, update UI immediately, append handicap to saved string, keep date visible
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

    // store round so handicap calc includes it
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

      // ensure date autofill remains visible and force input event to update UI on mobile
      autofillDateIfEmpty();
      const df = $id("date");
      if (df) { df.dispatchEvent(new Event("input", { bubbles: true })); df.blur(); }

      // final defensive recalculation
      setTimeout(() => calculateCumulativeHandicap(), 40);
    }, 40);
  }

  if (saveBtn) saveBtn.addEventListener("click", saveRoundAndRefreshUI);

  // initial render
  displayRounds();
  calculateCumulativeHandicap();

  // when returning to tab, ensure date and UI are up-to-date
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      autofillDateIfEmpty();
      calculateCumulativeHandicap();
      displayRounds();
    }
  });
});
