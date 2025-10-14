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
      const formatted = `${mm}/${dd}/${yyyy}`;
      dateField.value = formatted;
      dateField.setAttribute("value", formatted);
      dateField.dispatchEvent(new Event("input", { bubbles: true }));
      requestAnimationFrame(() => {
        dateField.dispatchEvent(new Event("input", { bubbles: true }));
        try { dateField.blur(); } catch (e) {}
      });
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

  // Normalize and escape helpers
  function normalizeBreaksForDisplay(s) {
    return String(s || "")
      .replace(/&lt;br&gt;/gi, "<br>")
      .replace(/\\u003E/gi, ">")
      .replace(/(^|[^<])br>/gi, "<br>")
      .replace(/<br\s*\/?>/gi, "<br>");
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/<br\s*\/?>/gi, "[[BR]]")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/

\[

\[BR\]

\]

/g, "<br>");
  }

  // Calculate handicap from stored rounds
  function calculateCumulativeHandicap() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_"));
    const handicaps = [];
    keys.forEach(key => {
      const round = localStorage.getItem(key) || "";
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

  // Render saved rounds (normalize stored variations, then escape except <br>)
  function displayRounds() {
    savedRounds.innerHTML = "<h2>Saved Rounds</h2>";
    const keys = Object.keys(localStorage).filter(k => k.startsWith("round_")).sort().reverse();
    keys.forEach(key => {
      const raw = localStorage.getItem(key) || "";
      const normalized = normalizeBreaksForDisplay(raw);
      const safe = escapeHtml(normalized);
      const entry = document.createElement("div");
      entry.className = "round-entry";
      entry.innerHTML = ` <span class="round-text">${safe}</span> <button class="delete-btn" data-key="${key}" title="Delete this round">×</button> `;
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

  // Save and refresh UI, keeping date visible and appending handicap to stored string
  function saveRoundAndRefreshUI() {
    autofillDateIfEmpty(); // ensure date present before validating

    const date = $id("date")?.value || "";
    const course = $id("course")?.value || "";
    const score = $id("score")?.value || "";
    const slope = $id("slope")?.value || "";
    const yardage = $id("yardage")?.value || "";
    const notes = $id("notes")?.value || "";

    // Mandatory field check (require Date, Score, Slope, Course)
    if (!date || !course || score.trim() === "" || slope.trim() === "") {
      alert("Please fill Date, Course, Score and Slope before saving.");
      return;
    }

    const key = `round_${Date.now()}`;
    const baseStored = `Date: ${date}, Score: ${score}, Slope: ${slope}, Yardage: ${yardage}, Notes: ${notes}`;
    try {
      localStorage.setItem(key, baseStored);
    } catch (err) {
      console.warn("localStorage write failed", err);
    }

    // Immediate UI update
    displayRounds();
    calculateCumulativeHandicap();

    // Append handicap into stored string after small delay to allow recalculation
    setTimeout(() => {
      const handicapField = $id("handicap");
      const currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";
      const storedWithHandicap = `${baseStored}, Handicap: ${currentHandicap}`;
      localStorage.setItem(key, storedWithHandicap);
      displayRounds();
      // Clear other inputs but keep date and handicap visible
      clearFormInputs($id("roundForm"));
      // Ensure date autofill remains visible on mobile
      autofillDateIfEmpty();
      const df = $id("date");
      if (df) { df.dispatchEvent(new Event("input", { bubbles: true })); df.blur(); }
      setTimeout(() => calculateCumulativeHandicap(), 40);
    }, 40);
  }

  if (saveBtn) saveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    saveRoundAndRefreshUI();
  });

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
