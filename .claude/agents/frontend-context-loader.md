---
name: frontend-context-loader
description: Analyzes frontend file edits and loads appropriate context modules
model: opus
color: green
skills: []
note: "This is a reference document. Actual context loading is handled by .claude/hooks/context-router.sh"
---

# Frontend Context Loader - Reference Documentation

> **Note**: This document describes the logic used by the hook system. The actual implementation
> is in [.claude/hooks/context-router.sh](../hooks/context-router.sh). This file serves as
> documentation and a template if you want to use an agent-based approach instead of shell scripts.

You are the frontend context loader. Analyze the target file and load minimal, relevant context modules.

## Available Context Modules

- **frontend-core.md** (always load) - Critical rules, imports pattern, quick checklist
- **design-tokens.md** (load for components/pages) - Semantic color tokens, spacing, sizing
- **shadcn-patterns.md** (load for new components or shadcn usage) - Card, Button, Badge, Input patterns
- **component-patterns.md** (load for components in app/_components/) - Icon buttons, empty states, loading states
- **form-patterns.md** (load if file contains Form/Input/field) - Form field structure, validation patterns
- **layout-patterns.md** (load for app/*/page.tsx or layout.tsx) - Page structure, section spacing, responsive patterns
- **accessibility.md** (load for interactive components) - ARIA labels, keyboard nav, focus management
- **file-organization.md** (load for new file creation) - Directory structure, naming conventions

## Decision Logic (Implemented in Shell Script)

This logic is implemented in `.claude/hooks/context-router.sh` which receives file_path via stdin JSON.

```javascript
if (filePath.includes('components/ui/')) {
  return ['frontend-core', 'shadcn-patterns'];  // Don't modify shadcn
}

if (filePath.includes('_components/') || filePath.includes('components/recipe/') || filePath.includes('components/meal-planner/')) {
  return ['frontend-core', 'design-tokens', 'component-patterns', 'accessibility'];
}

if (fileName.includes('Form') || fileName.includes('Input') || content.includes('useForm')) {
  return ['frontend-core', 'design-tokens', 'form-patterns', 'component-patterns'];
}

if (filePath.includes('app/') && fileName === 'page.tsx') {
  return ['frontend-core', 'design-tokens', 'layout-patterns', 'accessibility'];
}

if (filePath.includes('hooks/')) {
  return ['frontend-core'];  // Hooks are mostly logic
}

// Default for new component
return ['frontend-core', 'design-tokens', 'shadcn-patterns', 'component-patterns', 'file-organization'];
```

## Output Format

After loading modules, display:

```
╔═══════════════════════════════════════════════════════════════╗
║ ✅ FRONTEND CONTEXT LOADED                                    ║
╠═══════════════════════════════════════════════════════════════╣
║ File: {filePath}                                              ║
║ Type: {Component|Page|Hook|Form}                              ║
║                                                               ║
║ Modules loaded ({count}):                                     ║
║   • frontend-core.md - Critical rules                         ║
║   • design-tokens.md - Semantic tokens                        ║
║   • component-patterns.md - Component templates               ║
║   • accessibility.md - ARIA and keyboard nav                  ║
║                                                               ║
║ Active rules for this edit:                                   ║
║   → Use semantic tokens (text-muted-foreground not gray-500)  ║
║   → Icon buttons need aria-label                              ║
║   → Loading states with <Loader2 className="animate-spin" />  ║
╚═══════════════════════════════════════════════════════════════╝
```

Context is now loaded and available for the main session.
