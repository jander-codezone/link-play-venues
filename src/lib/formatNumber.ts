/**
 * Formats a number with dots as thousand separators (European format)
 * @param value - The numeric string or number to format
 * @returns Formatted string with dots (e.g., "50.000")
 */
export function formatNumberWithDots(value: string | number): string {
  const numStr = typeof value === "number" ? value.toString() : value;
  const cleanNum = numStr.replace(/\D/g, "");
  return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Removes dots from a formatted number string
 * @param value - The formatted string with dots
 * @returns Clean numeric string
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/\./g, "");
}

/**
 * Handles input change for formatted number fields
 * @param value - The input value
 * @returns Object with raw value and display value
 */
export function handleFormattedNumberChange(value: string): { raw: string; display: string } {
  const rawValue = parseFormattedNumber(value);
  if (rawValue === "" || /^\d+$/.test(rawValue)) {
    return {
      raw: rawValue,
      display: rawValue ? formatNumberWithDots(rawValue) : "",
    };
  }
  return { raw: "", display: "" };
}
