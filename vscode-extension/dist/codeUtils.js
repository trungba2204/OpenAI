"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractApplicableCode = extractApplicableCode;
exports.looksLikePartialSnippet = looksLikePartialSnippet;
/** Loại markdown fence và lấy code thuần để áp dụng editor */
function extractApplicableCode(raw) {
    let text = raw.trim();
    const fence = text.match(/^```[\w.-]*\s*\n([\s\S]*?)```\s*$/);
    if (fence)
        return fence[1].trim();
    const inner = text.match(/```[\w.-]*\s*\n([\s\S]*?)```/);
    if (inner)
        return inner[1].trim();
    return text;
}
function looksLikePartialSnippet(result, original) {
    const r = extractApplicableCode(result);
    const o = original.trim();
    if (r.length < o.length * 0.4 && o.length > 200)
        return true;
    if (o.includes('<style>') && !r.includes('<style>') && r.length < o.length)
        return true;
    return false;
}
//# sourceMappingURL=codeUtils.js.map