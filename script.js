document.addEventListener('DOMContentLoaded', () => {
  // ✅ Autofill today's date
  document.getElementById("date").value = new Date().toLocaleDateString("en-US");

  const saveBtn = document.getElementById("saveBtn");
  const savedRounds = document.getElementById("savedRounds");
  if (!savedRounds) {
    console.error("Missing #savedRounds element — check HTML IDs");
    return;
  }

  const dateEl = document.getElementById("date");
  const courseEl = document.getElementById("course");
  if (dateEl && courseEl) {
    dateEl.addEventListener("keydown", e => {
      const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
      if (!isEnter || document.activeElement !== dateEl) return;
      e.preventDefault(); e.stopPropagation();
      setTimeout(() => courseEl.focus(), 0);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  function saveRound() {
    const date = document.getElementById("date")?.value || "";
    const course = document.getElementById("course")?.value || "";
    const score = document.getElementById("score")?.value || "";
    const slope = document.getElementById("slope")?.value || "";
    const handicap = document.getElementById("handicap")?.value || "";
    const notes = document.getElementById("notes")?.value || "";

    const round = `${date} — ${course} | Score: ${score}, Slope: ${slope}, Handicap: ${handicap} | ${notes}`;
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem("round_" + timestamp, round);
    } catch (err) {
      console.warn("localStorage write failed", err);
    }

    displayRounds();

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
          dateField.value = new Date().toLocaleDateString("en-US");
          dateField.focus();
          if (dateField.setSelectionRange) dateField.setSelectionRange(0, 0);
        } catch (e) {}
      }
    }, 150);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveRound();
    });
  }

  displayRounds();
});
