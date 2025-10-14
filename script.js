document.addEventListener("DOMContentLoaded", () => {
  const $id = id => document.getElementById(id) || null;

  function autofillDateIfEmpty() {
    const dateField = $id("date");
    if (!dateField) return;
    if (String(dateField.value || "").trim() === "") {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      dateField.value = `${mm}/${dd}/${yyyy}`;
      dateField.dispatchEvent(new Event("input", { bubbles: true }));
      dateField.blur();
    }
  }

  autofillDateIfEmpty();

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
      li.innerHTML = `<span class="round-text">${escapeHtml(value || "")}</span> <button class="delete-btn" data-key="${escapeHtml(key)}" aria-label="Delete round">×</button>`;
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
      if (tid === "handicap" || tid === "date") return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = "";
      else if (el.tagName === "SELECT") el.selectedIndex = 0;
    });
  }

function saveRoundAndRefreshUI() {
  autofillDateIfEmpty();

  const date = $id("date")?.value || "";
  const course = $id("course")?.value || "";
  const score = $id("score")?.value || "";
  const slope = $id("slope")?.value || "";
  const yardage = $id("yardage")?.value || "";
  const notes = $id("notes")?.value || "";

  if (!date || !course || !score || !slope) {
    alert("Please fill Date, Course Name, Score and Slope before saving.");
    return;
  }

  const key = `round_${Date.now()}`;
 const baseStored = [
  `Course: ${course}`,
  `Date: ${date}`,
  `Score: ${score}`,
  `Slope: ${slope}`,
  yardage ? `Yardage: ${yardage}` : null,
  notes ? `Notes: ${notes}` : null
].filter(Boolean).join(" | ");

localStorage.setItem(key, baseStored);
displayRounds();
calculateCumulativeHandicap();

  setTimeout(() => {
    const handicapField = $id("handicap");
    const currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";
    const storedWithHandicap = `${baseStored}, Handicap: ${currentHandicap}`;
    localStorage.setItem(key, storedWithHandicap);
    displayRounds();
    clearFormInputs($id("roundForm"));
    autofillDateIfEmpty();
    const df = $id("date");
    if (df) {
      df.dispatchEvent(new Event("input", { bubbles: true }));
      df.blur();
    }
    setTimeout(() => calculateCumulativeHandicap(), 40);
  }, 40);
}

  if (saveBtn) saveBtn.addEventListener("click", saveRoundAndRefreshUI);

  displayRounds();
  calculateCumulativeHandicap();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      autofillDateIfEmpty();
      calculateCumulativeHandicap();
      displayRounds();
    }
  });
});
