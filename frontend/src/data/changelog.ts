// ============================================
// CHANGELOG - Edit the markdown below
// ============================================
const CHANGELOG_MD = `
## 2025-12-27 - Improvements
- Shopping list quantities now display as fractions (½, ¼) instead of decimals for easier reading while shopping
- Improved sidebar navigation

## 2025-12-27 - Bug Fixes
- The "Favorites Only" filter in Recipe Browser now works correctly

## 2025-12-27 - New Features
- Quickly access recently viewed recipes from the sidebar
- Recipes now display fun emoji icons for easy visual recognition

## 2024-12-27 - Latest Updates
- Drag-and-drop reordering of ingredients when adding or editing recipes
- Fixed ingredient autocomplete for multi-word ingredients like 'olive oil'
- Removed duplicate 'Ranch Seasoning' ingredient from database
`;

// ============================================
// Parser (don't edit below this line)
// ============================================
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const sections = markdown.split(/^## /gm).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const headerMatch = lines[0].match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/);
    if (!headerMatch) continue;

    const [, version, title] = headerMatch;
    const changes = lines
      .slice(1)
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim());

    entries.push({
      version,
      date: formatDate(version),
      title: title.trim(),
      changes,
    });
  }

  return entries;
}

export const CHANGELOG_ENTRIES = parseChangelog(CHANGELOG_MD);
