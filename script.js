  // when returning to tab, ensure date and UI are up-to-date
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      autofillDateIfEmpty();
      calculateCumulativeHandicap();
      displayRounds();
    }
  });
});
