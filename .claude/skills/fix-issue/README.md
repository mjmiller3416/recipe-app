# Fix GitHub Issue Skill

Automatically fetch, analyze, and fix GitHub issues with proper branch management and architecture adherence.

## Quick Start

```bash
/fix-issue 57
```

This will:
1. Fetch issue #57 from GitHub
2. Create a properly named branch
3. Analyze whether it's frontend, backend, or full-stack
4. Implement the fix following project conventions
5. Verify the implementation
6. Leave changes ready for review and commit

## Requirements

- GitHub CLI (`gh`) installed and authenticated
- Next.js dev server running (for frontend issues)
- Backend dev server running (for backend issues)

## What It Does

- **Smart Analysis**: Reads issue labels, title, and body to determine issue type
- **Branch Management**: Uses git skill conventions (`claude/issue-<number>-<timestamp>`)
- **Architecture Adherence**: Follows frontend-design and backend-dev patterns
- **Type Safety**: Maintains full TypeScript/Pydantic type safety
- **Testing**: Runs appropriate tests and build verification
- **Minimal Changes**: Only modifies what's necessary

## Integration

Works seamlessly with other skills:
- `/git` - For branch creation and commit conventions
- `/frontend-design` - For UI component patterns
- `/backend-dev` - For layered architecture patterns

## Examples

```bash
# Fix a UI bug
/fix-issue 57

# Implement a backend feature
/fix-issue 82

# Add a full-stack feature
/fix-issue 91
```

See [SKILL.md](SKILL.md) for detailed documentation and examples.