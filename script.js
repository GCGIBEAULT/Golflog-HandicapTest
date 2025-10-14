function saveRound() {
  const date = document.getElementById("date")?.value || "";
  const course = document.getElementById("course")?.value || "";
  const scoreVal = parseFloat(document.getElementById("score")?.value || "");
  const slopeVal = parseFloat(document.getElementById("slope")?.value || "");
  const yardage = document.getElementById("yardage")?.value || "";
  const notes = document.getElementById("notes")?.value || "";

  // 🔴 Mandatory field check
  if (!course || isNaN(scoreVal) || isNaN(slopeVal)) {
    alert("Please enter Course, Score, and Slope before saving.");
    return;
  }

  let handicapVal = "";
  if (!isNaN(scoreVal) && !isNaN(slopeVal) && slopeVal !== 0) {
    const scaled = ((scoreVal - 72) / slopeVal) * 113;
    handicapVal = Math.max(0, Math.min(scaled, 36)).toFixed(1);
  }

  const round = `${date} — ${course} | Score: ${scoreVal}, Slope: ${slopeVal}, Yardage: ${yardage} | ${notes}`;

  const timestamp = new Date().toISOString();
  try {
    localStorage.setItem("round_" + timestamp, round);
  } catch (err) {
    console.warn("localStorage write failed", err);
  }

  displayRounds();

  const form = document.getElementById("roundForm") || document.querySelector("form");
  if (form) try { form.reset(); } catch (e) {}

  // Refill date after reset
  const dateField = document.getElementById("date");
  if (dateField) {
    try {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      dateField.value = `${mm}/${dd}/${yyyy}`;
      dateField.focus();
      if (dateField.setSelectionRange) dateField.setSelectionRange(0, 0);
    } catch (e) {}
  }
}
