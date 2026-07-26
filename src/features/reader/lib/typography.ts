/**
 * EPUB stylesheets often hardcode font sizes in px/pt, which makes the reader's
 * font-size setting a no-op for those elements. Rewriting them to rem keeps the
 * book's own size hierarchy while making every size scale from `html`.
 */

const ROOT_FONT_SIZE_PX = 16;
const PT_TO_PX = 4 / 3;
const ABSOLUTE_FONT_SIZE = /^(\d*\.?\d+)(px|pt)$/i;

/** '24px' -> '1.5rem', '10pt' -> '0.833rem'. Relative values return null. */
export function toRemFontSize(value: string): string | null {
  const match = ABSOLUTE_FONT_SIZE.exec(value.trim());
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const px = match[2].toLowerCase() === 'pt' ? amount * PT_TO_PX : amount;
  return `${Number((px / ROOT_FONT_SIZE_PX).toFixed(3))}rem`;
}

function relativizeDeclaration(style: CSSStyleDeclaration): void {
  const rem = toRemFontSize(style.fontSize);
  if (!rem) return;

  style.setProperty('font-size', rem, style.getPropertyPriority('font-size'));
}

function relativizeRules(rules: CSSRuleList): void {
  for (const rule of Array.from(rules)) {
    if ('style' in rule) relativizeDeclaration((rule as CSSStyleRule).style);
    // Grouping rules (@media, @supports) nest their own declarations.
    if ('cssRules' in rule) relativizeRules((rule as CSSGroupingRule).cssRules);
  }
}

/** Idempotent: rem/em values no longer match, so re-running is a no-op. */
export function relativizeFontSizes(doc: Document): void {
  for (const sheet of Array.from(doc.styleSheets)) {
    // epub.js injects our theme before this hook runs; rewriting its own
    // `html { font-size }` to rem would make the setting self-referential.
    const ownerId = (sheet.ownerNode as Element | null)?.id ?? '';
    if (ownerId.startsWith('epubjs-inserted-css')) continue;

    try {
      relativizeRules(sheet.cssRules);
    } catch {
      // Unreadable stylesheet (cross-origin); leave it alone.
    }
  }

  // ponytail: attribute-value matching is case-sensitive in XHTML, so scan every
  // [style] instead of [style*="font-size"].
  doc.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    relativizeDeclaration(element.style);
  });
}
