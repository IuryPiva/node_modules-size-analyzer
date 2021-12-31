
export function toMegabits(val: number) {
  return (val * 1e-6).toFixed(2).concat("M");
}