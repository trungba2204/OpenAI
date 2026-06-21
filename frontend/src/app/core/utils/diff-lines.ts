/** Trả về số dòng (1-based) có nội dung khác giữa bản cũ và bản mới. */
export function getChangedLineNumbers(oldText: string, newText: string): number[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const max = Math.max(oldLines.length, newLines.length);
  const changed: number[] = [];
  for (let i = 0; i < max; i++) {
    if ((oldLines[i] ?? '') !== (newLines[i] ?? '')) {
      changed.push(i + 1);
    }
  }
  return changed;
}
