# Frontend Design

Automate frontend tasks using the Meal Genie design system.

## Skill Reference

**Always read first:** `.claude/skills/frontend-design/SKILL.md`

For token values, see `globals.css`. For component patterns, reference existing implementations.

## Arguments

$ARGUMENTS

## Workflows

| Command | Description |
|---------|-------------|
| `scaffold <type> <n>` | Create page, component, section, or hook |
| `audit [target]` | Check design system compliance |
| `lookup <query>` | Quick reference for tokens or components |
| `add <component>` | Add shadcn/ui component |
| (no args) | Show frontend status and suggestions |

### scaffold

**Types:** `page`, `component`, `section`, `hook`

1. Parse name: `recipe-filter` → `RecipeFilter`
2. Determine location based on type and domain
3. Check for similar existing components
4. Check shadcn registry for relevant primitives
5. Generate following all design system rules from skill file
6. Run quick audit checklist

**Locations:**
- `page` → `src/app/<n>/page.tsx`
- `component` → `src/components/<domain>/`
- `section` → `src/app/<page>/_components/`
- `hook` → `src/hooks/use<n>.ts`

### audit

**Targets:** file path, component name, "recent" for git diff

1. Scan for critical violations (fake cards, raw buttons, hardcoded colors)
2. Report with line numbers and fixes
3. Offer to apply fixes

### lookup

Quick reference for tokens, components, or patterns.

```
/frontend lookup text-muted-foreground  # Token info
/frontend lookup Card                    # Component usage
/frontend lookup form layout             # Pattern example
```

### add

Install shadcn/ui components:

```bash
/frontend add dialog
# Runs: npx shadcn@latest add dialog
```

Shows usage with design system context after install.

## File Locations

| Resource | Path |
|----------|------|
| Pages | `src/app/` |
| shadcn/ui components | `src/components/ui/` |
| Shared components | `src/components/common/` |
| Domain components | `src/components/<domain>/` |
| Hooks | `src/hooks/` |
| Design tokens | `src/app/globals.css` |

## Examples

```
/frontend                                # Status overview
/frontend scaffold page settings         # New page
/frontend scaffold component recipe-filter  # New component
/frontend scaffold section planner-header   # Page-specific component
/frontend audit RecipeCard               # Audit specific component
/frontend audit recent                   # Audit recently modified
/frontend lookup bg-card                 # Token reference
/frontend add dialog                     # Install shadcn component
```