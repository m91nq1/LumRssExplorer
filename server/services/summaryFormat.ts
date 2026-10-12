export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Normalize whitespace only. Never truncate sentences or split them mid-thought.
export function normalizeSummary(text: string): string {
  return text.trim().split(/\n\s*\n/).map(paragraph => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean).join("\n\n");
}

export function meetsSummaryRequirements(text: string): boolean {
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim());
  return paragraphs.length === 2 && wordCount(text) >= 120 && wordCount(text) <= 180 &&
    paragraphs.every(paragraph => wordCount(paragraph) >= 60 && wordCount(paragraph) <= 90) &&
    paragraphs.every(paragraph => !/^(#|[-*] |paragraph \d|summary:)/i.test(paragraph.trim()));
}
