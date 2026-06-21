/** Chuẩn hóa path để so khớp file. */
export function pathsMatch(a: string, b: string): boolean {
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '').trim();
  return norm(a) === norm(b);
}

/** Trích code từ phản hồi AI (ưu tiên code fence). */
export function extractCodeFromAi(raw: string): string {
  if (!raw) return '';
  const fence = raw.match(/```[\w-]*\n?([\s\S]*?)```/);
  if (fence?.[1] != null) return fence[1].replace(/\r\n/g, '\n').trimEnd();
  return raw.replace(/\r\n/g, '\n').trim();
}

/**
 * Khi AI trả về cả file thay vì chỉ đoạn chọn, chỉ lấy phần tương ứng dòng start..end.
 * Nếu AI trả đúng snippet ngắn thì giữ nguyên.
 */
export function normalizeReplacementForRange(
  original: string,
  startLine: number,
  endLine: number,
  aiContent: string
): string {
  const origLines = original.split('\n');
  const aiLines = aiContent.replace(/\r\n/g, '\n').split('\n');
  const selectedCount = Math.max(1, endLine - startLine + 1);

  const start = Math.max(1, Math.min(startLine, origLines.length));
  const end = Math.max(start, Math.min(endLine, origLines.length));

  // AI trả gần như cả file → chỉ lấy slice đúng vùng chọn
  if (aiLines.length >= origLines.length * 0.8 && aiLines.length > selectedCount + 2) {
    return aiLines.slice(start - 1, end).join('\n');
  }

  return aiContent.replace(/\r\n/g, '\n').trimEnd();
}

/** Tính endLine thực tế từ startLine và số dòng trong đoạn code đã chọn. */
export function resolveSelectionEndLine(startLine: number, selectedCode: string): number {
  const lineCount = Math.max(1, selectedCode.replace(/\r\n/g, '\n').split('\n').length);
  return startLine + lineCount - 1;
}

/**
 * AI hay trả thêm các dòng đã có phía dưới vùng chọn (price, `}`, …).
 * Bỏ phần đuôi trùng với `after` của file gốc để không ghi đè / nhân đôi.
 */
export function sanitizeReplacementInScope(
  original: string,
  startLine: number,
  endLine: number,
  replacement: string
): string {
  const origLines = original.replace(/\r\n/g, '\n').split('\n');
  const afterLines = origLines.slice(endLine).map(l => l.trim());
  if (!afterLines.length) return replacement;

  let replLines = replacement.replace(/\r\n/g, '\n').split('\n');

  while (replLines.length > 0) {
    const lastTrim = replLines[replLines.length - 1].trim();
    if (lastTrim === '' && replLines.length > 1) {
      replLines.pop();
      continue;
    }
    if (afterLines.length > 0 && lastTrim === afterLines[0]) {
      replLines.pop();
      afterLines.shift();
      continue;
    }
    if (lastTrim === '}' && afterLines.some(l => l === '}')) {
      replLines.pop();
      break;
    }
    break;
  }

  return replLines.join('\n');
}

/** Ghép replacement vào đúng dòng start..end (1-based, inclusive). Phần ngoài giữ nguyên 100%. */
export function mergePartialEdit(
  original: string,
  startLine: number,
  endLine: number,
  replacement: string
): string {
  const lines = original.replace(/\r\n/g, '\n').split('\n');
  const start = Math.max(1, Math.min(startLine, lines.length));
  const end = Math.max(start, Math.min(endLine, lines.length));

  const before = lines.slice(0, start - 1);
  const after = lines.slice(end);
  const middle = replacement.replace(/\r\n/g, '\n').split('\n');

  return [...before, ...middle, ...after].join('\n');
}

/** Áp dụng sửa partial — không bao giờ thay cả file khi có selection. */
export function applyScopedEdit(
  original: string,
  edit: { path: string; content: string; partial?: boolean; startLine?: number; endLine?: number },
  selection: { filePath: string; startLine: number; endLine: number; selectedCode?: string } | null
): string {
  const aiContent = extractCodeFromAi(edit.content);

  let startLine: number | null = null;
  let endLine: number | null = null;

  // Luôn ưu tiên vùng user đã khóa — không tin startLine/endLine AI trả về
  if (selection && pathsMatch(edit.path, selection.filePath)) {
    startLine = selection.startLine;
    endLine = selection.selectedCode
      ? resolveSelectionEndLine(selection.startLine, selection.selectedCode)
      : selection.endLine;
  } else if (edit.partial && edit.startLine != null && edit.endLine != null) {
    startLine = edit.startLine;
    endLine = edit.endLine;
  }

  if (startLine != null && endLine != null) {
    let replacement = normalizeReplacementForRange(original, startLine, endLine, aiContent);
    replacement = sanitizeReplacementInScope(original, startLine, endLine, replacement);
    return mergePartialEdit(original, startLine, endLine, replacement);
  }

  return aiContent;
}
