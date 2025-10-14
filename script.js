document.addEventListener("DOMContentLoaded", () => {
  const $id = id => document.getElementById(id) || null;

  const saveBtn = $id("saveBtn");
  const savedRounds = $id("savedRounds");
  if (!savedRounds) {
    console.error("savedRounds element missing");
    return;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isValidRound(course, score, slope) {
    return String(course).trim() !== "" &&
           String(score).trim() !== "" &&
           String(slope).trim() !== "";
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
      const value = localStorage.getItem(key) || "";
      const li = document.createElement("li");
      const safe = escapeHtml(value).replace(/&lt;br&gt;/g, "<br>");
      li.innerHTML = `<span class="round-text">${safe}</span> <button class="delete-btn" data-key="${escapeHtml(key)}" aria-label="Delete round">×</button>`;
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

  function clearFormInputs(form) {
    if (!form) return;
    Array.from(form.elements).forEach(el => {
      const tid = (el.id || "").toLowerCase();
      if (tid === "handicap") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = "";
      else if (el.tagName === "SELECT") el.selectedIndex = 0;
    });
  }

  function saveRoundAndRefreshUI() {
    const date = $id("date")?.value || "";
    const course = $id("course")?.value || "";
    const score = $id("score")?.value || "";
    const slope = $id("slope")?.value || "";
    const yardage = $id("yardage")?.value || "";
    const notes = $id("notes")?.value || "";

    if (!isValidRound(course, score, slope)) {
      alert("Course Name, Score, and Slope are required.");
      return;
    }

    const key = `round_${Date.now()}`;

    const handicapField = $id("handicap");
    let currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";

    if ((!currentHandicap || currentHandicap === "—") && score && slope) {
      const s = parseFloat(score);
      const sl = parseFloat(slope);
      if (!isNaN(s) && !isNaN(sl) && sl !== 0) {
        const scaled = ((s - 72) / sl) * 113;
        const h = Math.max(0, Math.min(scaled, 36));
        currentHandicap = (Math.round(h * 10) / 10).toFixed(1);
      }
    }

    const baseStored = [
      date ? `${date}. Course: ${course}` : `Course: ${course}`,
      `Score: ${score}, Slope: ${slope}, Handicap: ${currentHandicap}`,
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join("<br>");

    localStorage.setItem(key, baseStored);
    displayRounds();
    calculateCumulativeHandicap();

    setTimeout(() => {
      clearFormInputs($id("roundForm"));
      const df = $id("date");
      if (df) {
        df.dispatchEvent(new Event("input", { bubbles: true }));
        df.blur();
      }
      setTimeout(() => calculateCumulativeHandicap(), 40);
    }, 40);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      saveRoundAndRefreshUI();
    });
  }

  displayRounds();
  calculateCumulativeHandicap();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      calculateCumulativeHandicap();
      displayRounds();
    }
  });
});
