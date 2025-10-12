// script.js
document.addEventListener('DOMContentLoaded', () => {
 const dateField = document.getElementById("date");
if (dateField && !dateField.value) {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yyyy = today.getFullYear();
  dateField.value = `${mm}/${dd}/${yyyy}`;
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

  // 🔒 Strong override: catch Enter before other handlers and force focus shift
  (function () {
    function handler(e) {
      const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
      if (!isEnter) return;
      if (document.activeElement !== dateInput) return;

      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation();
      }

      setTimeout(() => {
        courseInput.focus();
        console.log("OVERRIDE: Enter on Date → moved focus to Course");
      }, 0);
    }

    document.addEventListener("keydown", handler, { capture: true });
    document.addEventListener("keypress", handler, { capture: true });
  })();

  // 🧠 Secondary listener for redundancy
  function advanceToCourse(e) {
    const isEnter = e.key === "Enter" || e.code === "Enter" || e.keyCode === 13;
    if (!isEnter) return;
    if (document.activeElement !== dateInput) return;

    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => {
      courseInput.focus();
      console.log("Date → Course: Enter handled, focus moved");
    }, 0);
  }

  dateInput.removeEventListener("keydown", advanceToCourse);
  dateInput.addEventListener("keydown", advanceToCourse);
  dateInput.addEventListener("keypress", advanceToCourse);

  // 💾 Save logic
  function saveRound() {
    const date = dateInput.value;
    const course = courseInput.value;
    const score = scoreInput?.value || "";
    const slope = slopeInput?.value || "";
    const handicap = handicapInput?.value || "";
    const notes = notesInput?.value || "";

    const round = `${date} — ${course} | Score: ${score}, Slope: ${slope}, Handicap: ${handicap} | ${notes}`;
    const timestamp = new Date().toLocaleString();

    try {
      localStorage.setItem("round_" + timestamp, round);
    } catch (err) {
      console.warn("Could not write to localStorage", err);
    }

    displayRounds();

    // 🧹 Clear inputs after save
    dateInput.value = "";
    courseInput.value = "";
    scoreInput.value = "";
    slopeInput.value = "";
    handicapInput.value = "";
    notesInput.value = "";

    // 🔁 Reset focus to Date
    dateInput.focus();
  }

  // 📋 Display logic
function displayRounds() {
  if (!savedRounds) return;
  savedRounds.innerHTML = "<h2>Saved Rounds</h2>";

  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("round_")) {
      keys.push(key);
    }
  }

  keys.sort().reverse(); // newest first

  for (const key of keys) {
    const round = localStorage.getItem(key);
    const entry = document.createElement("div");
    entry.className = "round-entry";
    entry.textContent = round;
    savedRounds.appendChild(entry);
  }
}

  if (saveBtn) saveBtn.addEventListener("click", saveRound);

  displayRounds();

  console.log("script.js loaded — Enter override active, fields clear after save");
});
