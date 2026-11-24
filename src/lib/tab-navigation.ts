export function getTabValueForKey(
  currentValue: string,
  values: string[],
  key: string,
): string | null {
  if (values.length < 2) return null;
  const currentIndex = values.indexOf(currentValue);
  const index = currentIndex < 0 ? 0 : currentIndex;

  switch (key) {
    case "ArrowRight":
      return values[(index + 1) % values.length];
    case "ArrowLeft":
      return values[(index - 1 + values.length) % values.length];
    case "Home":
      return values[0];
    case "End":
      return values[values.length - 1];
    default:
      return null;
  }
}
