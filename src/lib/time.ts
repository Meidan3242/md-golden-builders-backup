/** "2026-10-14T09:00" typed in San Diego → the real moment in UTC. */
export function sanDiegoToUtc(local: string) {
  const guess = new Date(`${local}:00Z`);
  const shown = new Date(guess.toLocaleString("sv-SE", { timeZone: "America/Los_Angeles" }).replace(" ", "T") + "Z");
  return new Date(guess.getTime() + (guess.getTime() - shown.getTime()));
}
