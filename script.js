document.addEventListener("DOMContentLoaded", () => {
  const $id = id => document.getElementById(id) || null;

  // ---------- Utility: visual marking ----------
  function markMissingFields(fields) {
    fields.forEach(f => {
      if (!f) return;
      f.style.borderColor = "#c00";
      f.style.backgroundColor = "#fee";
    });
  }

  function clearFieldMarks(fields) {
    fields.forEach(f => {
      if (!f) return;
      f.style.borderColor = "";
      f.style.backgroundColor = "";
    });
  }

  // ---------- Centralized validator ----------
  function validateRequiredCourseScoreSlope() {
    const courseField = $id("course");
    const scoreField = $id("score");
    const slopeField = $id("slope");

    const course = courseField?.value?.trim() || "";
    const score = scoreField?.value?.trim() || "";
    const slope = slopeField?.value?.trim() || "";

    const missing = [];
    if (!course) missing.push(courseField);
    if (!score) missing.push(scoreField);
    if (!slope) missing.push(slopeField);

    if (missing.length > 0) {
      markMissingFields(missing);
      clearFieldMarks([courseField, scoreField, slopeField].filter(f => !missing.includes(f)));
      alert("Course Name, Score, and Slope are required.");
      return false;
    }

    clearFieldMarks([courseField, scoreField, slopeField]);
    return true;
  }

  // ---------- Disable native browser required UI so we control flow ----------
  const roundForm = $id("roundForm");
  if (roundForm) roundForm.noValidate = true;

  // ---------- Wire form submit to centralized validator ----------
  if (roundForm) {
    roundForm.addEventListener("submit", function (e) {
      if (!validateRequiredCourseScoreSlope()) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        // allow submit to proceed if you still use native submit elsewhere
      }
    });
  }

  // ---------- Autofill today's date if empty and keep UI updated for mobile ----------
  function autofillDateIfEmpty() {
    const dateField = $id("date");
    if (!dateField) return;
    if (String(dateField.value || "").trim() === "") {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = String(today.getFullYear());
      dateField.value = `${mm}/${dd}/${yyyy}`;
      dateField.dispatchEvent(new Event("input", { bubbles: true }));
      dateField.blur();
    }
  }

  // ---------- Core save function (keeps your app flow) ----------
  // This function assumes displayRounds(), calculateCumulativeHandicap(), clearFormInputs() exist elsewhere.
  function saveRoundAndRefreshUI() {
    autofillDateIfEmpty();

    // Defensive validation
    if (!validateRequiredCourseScoreSlope()) return;

    const date = $id("date")?.value?.trim() || "";
    const course = $id("course")?.value?.trim() || "";
    const score = $id("score")?.value?.trim() || "";
    const slope = $id("slope")?.value?.trim() || "";
    const yardage = $id("yardage")?.value?.trim() || "";
    const notes = $id("notes")?.value?.trim() || "";

    const key = `round_${Date.now()}`;
    const baseStored = `Date: ${date}, Course: ${course}, Score: ${score}, Slope: ${slope}, Yardage: ${yardage}, Notes: ${notes}`;
    try {
      localStorage.setItem(key, baseStored);
    } catch (err) {
      console.error("localStorage set error:", err);
    }

    if (typeof displayRounds === "function") displayRounds();
    if (typeof calculateCumulativeHandicap === "function") calculateCumulativeHandicap();

    setTimeout(() => {
      const handicapField = $id("handicap");
      const currentHandicap = handicapField && handicapField.value ? handicapField.value : "—";
      const storedWithHandicap = `${baseStored}, Handicap: ${currentHandicap}`;
      try {
        localStorage.setItem(key, storedWithHandicap);
      } catch (err) {
        console.error("localStorage set error:", err);
      }
      if (typeof displayRounds === "function") displayRounds();

      if (typeof clearFormInputs === "function") {
        clearFormInputs($id("roundForm"));
      } else if (roundForm) {
        roundForm.reset();
        autofillDateIfEmpty();
      }

      const df = $id("date");
      if (df) {
        df.dispatchEvent(new Event("input", { bubbles: true }));
        df.blur();
      }

      setTimeout(() => {
        if (typeof calculateCumulativeHandicap === "function") calculateCumulativeHandicap();
      }, 40);
    }, 40);
  }

  // ---------- Wire Save button to centralized save function ----------
  const saveBtn = $id("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!validateRequiredCourseScoreSlope()) return;
      saveRoundAndRefreshUI();
    });
  }

  // ---------- Visibility handling: refresh UI when returning to tab ----------
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (typeof displayRounds === "function") displayRounds();
      if (typeof calculateCumulativeHandicap === "function") calculateCumulativeHandicap();
    }
  });

  // ---------- Optional: clear visual marks on user input for required fields ----------
  const clearOnInputIds = ["course", "score", "slope"];
  clearOnInputIds.forEach(id => {
    const el = $id(id);
    if (!el) return;
    el.addEventListener("input", () => {
      el.style.borderColor = "";
      el.style.backgroundColor = "";
    });
    el.addEventListener("blur", () => {
      el.value = (el.value || "").trim();
    });
  });

  // initial autofill for date if empty
  autofillDateIfEmpty();
});
