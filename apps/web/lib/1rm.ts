/** Epley formula: 1RM = w * (1 + reps / 30) */
export function calcOneRm(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}
