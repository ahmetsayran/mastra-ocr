/**
 * Extraction Helper Utilities
 *
 * Provides functions for showing and editing extracted document data
 */

type ExtractionParty = { role: string; name: string };

/**
 * Format one list item of extracted data
 * Contract parties are { role, name }; documents extracted before that keep plain text items
 *
 * @param item - A list item (text or contract party)
 * @returns The item as one line of text
 *
 * @example
 * formatListItem({ role: 'Kiracı', name: 'Ali Yılmaz' }) // "Kiracı: Ali Yılmaz"
 * formatListItem('Kira her ay ödenir') // "Kira her ay ödenir"
 */
export function formatListItem(item: unknown): string {
  if (typeof item === 'object' && item !== null && 'name' in item) {
    const { role, name } = item as ExtractionParty;
    return role ? `${role}: ${name}` : name;
  }
  return String(item);
}

/**
 * Parse a "Role: Name" line of the correction form back into a contract party
 *
 * @param line - One line typed in the parties field
 * @returns The contract party
 *
 * @example
 * parseParty('Kiracı: Ali Yılmaz') // { role: 'Kiracı', name: 'Ali Yılmaz' }
 * parseParty('Ali Yılmaz') // { role: '', name: 'Ali Yılmaz' }
 */
export function parseParty(line: string): ExtractionParty {
  const separator = line.indexOf(':');
  if (separator === -1) return { role: '', name: line };
  return { role: line.slice(0, separator).trim(), name: line.slice(separator + 1).trim() };
}
