// Splits text longer than maxLength at word boundaries (PDF text often has no line breaks)
export function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const parts: string[] = [];
  let part = '';

  for (const word of text.split(/\s+/)) {
    if (part && part.length + word.length + 1 > maxLength) {
      parts.push(part);
      part = '';
    }
    part += part ? ` ${word}` : word;
  }
  if (part) parts.push(part);

  return parts;
}
