# Hook System Reference

This document provides detailed information about the hook-based context system used in this project.

## Overview

The hook system automatically loads relevant context when Claude Code edits files. This eliminates the need for manual context loading and significantly improves response time.

## System Requirements

### Required Dependencies

**jq** - JSON parser for hook scripts
- **Windows**: `choco install jq` or download from https://jqlang.github.io/jq/download/
- **macOS**: `brew install jq`
- **Linux**: `apt-get install jq` or `yum install jq`

**Git Bash** (Windows only)
- Required for running bash scripts on Windows
- Install via Git for Windows: https://git-scm.com/download/win

### Verification

Check that dependencies are installed:
```bash
jq --version          # Should show jq version
bash --version        # Should show bash version
```

## Hook Scripts

Located in `.claude/hooks/`:

- `context-router.sh` - Loads context based on file path (PreToolUse hook)
- `design-auditor.sh` - Checks for design violations (PostToolUse hook)
- `session-init.sh` - Refreshes context after compaction (SessionStart hook)
- `work-verification.sh` - Checks for uncommitted changes (Stop hook)
- `hooks.log` - Execution log showing what hooks ran and results

## Monitoring Hook Execution

Hooks write to `.claude/hooks/hooks.log` with the following format:
```
[HH:MM:SS] hook_name | filename | result
```

**Watch in real-time:**
```bash
# View last 20 lines
tail -20 .claude/hooks/hooks.log

# Follow live (updates automatically)
tail -f .claude/hooks/hooks.log

# Watch with auto-refresh every 2 seconds
watch -n 2 tail -20 .claude/hooks/hooks.log
```

**Example log output:**
```
[14:32:15] context-router | RecipeCard.tsx | Frontend context loaded
[14:32:16] design-auditor | RecipeCard.tsx | ✓ No violations
[14:33:01] context-router | recipe_service.py | Backend context loaded
[14:35:42] design-auditor | AddRecipeForm.tsx | ✗ 2 violation(s)
```

## Context Modules

Located in `.claude/context/`:

### Frontend Modules
- `frontend-core.md` - Core frontend patterns and structure
- `design-tokens.md` - Design system tokens and CSS variables
- `shadcn-patterns.md` - shadcn/ui component usage patterns
- `component-patterns.md` - React component patterns
- `form-patterns.md` - Form handling patterns
- `layout-patterns.md` - Layout component patterns
- `accessibility.md` - Accessibility guidelines
- `file-organization.md` - Frontend file organization

### Backend Modules
- `backend-core.md` - Core backend patterns
- `architecture.md` - Layered architecture details
- `models.md` - SQLAlchemy model patterns
- `repositories.md` - Repository layer patterns
- `services.md` - Service layer patterns
- `dtos.md` - Pydantic DTO patterns
- `routes.md` - FastAPI route patterns
- `migrations.md` - Alembic migration patterns
- `exceptions.md` - Error handling patterns

## How Marker Files Work

The system uses marker files to track which context has been loaded in the current session. This prevents redundant loading and improves performance.

### Marker File Locations

- **Windows**: `%TEMP%\claude-*-context-{session_id}`
- **macOS/Linux**: `$TMPDIR/claude-*-context-{session_id}` or `/tmp/claude-*-context-{session_id}`

Context is loaded **once per session** and persists until the session ends or is compacted.

## Troubleshooting

### "jq: command not found" error

**Cause**: jq is not installed or not in PATH

**Solution**:
1. Install jq using the commands in System Requirements above
2. Restart your terminal
3. Verify installation: `jq --version`

### Hooks not working

**Possible causes and solutions**:

1. **Check hook permissions**:
   ```bash
   ls -l .claude/hooks/*.sh
   # Should show executable permissions (rwxr-xr-x)
   ```

   Fix if needed:
   ```bash
   chmod +x .claude/hooks/*.sh
   ```

2. **Test manually**:
   ```bash
   bash .claude/hooks/test-hooks.sh
   ```

3. **Verify bash is installed** (Windows users need Git for Windows):
   ```bash
   bash --version
   ```

4. **Verify jq is installed**:
   ```bash
   jq --version
   ```

5. **Check marker files are created**:
   ```bash
   # Windows
   dir %TEMP%\claude-*-context-*

   # macOS/Linux
   ls $TMPDIR/claude-*-context-* || ls /tmp/claude-*-context-*
   ```

### Context not loading

**Symptoms**: Expected context modules are not appearing in Claude's responses

**Solutions**:

1. **Verify context modules exist**:
   ```bash
   ls .claude/context/frontend/
   ls .claude/context/backend/
   ```

2. **Check file path matches pattern**:
   - Frontend files must be under: `frontend/src/**/*`
   - Backend files must be under: `backend/app/**/*`

3. **Clear stale session markers**:
   ```bash
   # Windows
   del %TEMP%\claude-*-context-*

   # macOS/Linux
   rm $TMPDIR/claude-*-context-* || rm /tmp/claude-*-context-*
   ```

   Then retry your edit operation.

4. **Check hook output** (see Debug Mode below)

### Troubleshooting Hook Execution

If hooks don't seem to be running, check the log file:

```bash
# Check if hooks have run recently
tail -20 .claude/hooks/hooks.log

# If log is empty or stale, verify hook configuration
cat .claude/settings.json | grep -A 30 hooks
```

Common issues:
- **No log entries**: Hooks might not be configured in settings.json
- **Old timestamps**: Hooks may have stopped running (restart Claude Code)
- **File not found errors**: Path handling issue (check Windows vs Unix paths)

## Performance Metrics

- **Before (agent-based)**: ~90 seconds per edit (3 agent spawns)
- **After (hook-based)**: ~<1 second per edit (1 shell script)
- **Context loading**: Once per session (cached via marker files)

## Advanced Configuration

### Customizing Context Modules

To add new context modules:

1. Create markdown file in `.claude/context/frontend/` or `.claude/context/backend/`
2. Update `context-router.sh` to include the new module in the appropriate pattern

### Modifying Hook Behavior

Edit hook scripts in `.claude/hooks/`:
- Make sure scripts remain fast (<1s execution time)
- Always output to stderr for debugging (`>&2`)
- Use marker files to prevent redundant work
- Return exit code 0 for success

### Disabling Hooks Temporarily

To temporarily disable hooks:
```bash
# Rename hooks to disable
mv .claude/hooks/context-router.sh .claude/hooks/context-router.sh.disabled
```

To re-enable:
```bash
mv .claude/hooks/context-router.sh.disabled .claude/hooks/context-router.sh
```

## Additional Resources

- Main documentation: [.claude/CLAUDE.md](.claude/CLAUDE.md)
- Hook configuration: [.claude/claude.json](.claude/claude.json)
- Context modules: [.claude/context/](.claude/context/)
