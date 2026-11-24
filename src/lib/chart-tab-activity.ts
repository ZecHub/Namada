/** Components outside the chart tabs stay active; inactive panels pause work. */
export function isChartTabActive(active: boolean | null): boolean {
  return active ?? true;
}
