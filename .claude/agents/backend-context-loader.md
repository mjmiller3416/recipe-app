---
name: backend-context-loader
description: Analyzes backend file edits and loads appropriate context modules
model: opus
color: cyan
skills: []
note: "This is a reference document. Actual context loading is handled by .claude/hooks/context-router.sh"
---

# Backend Context Loader - Reference Documentation

> **Note**: This document describes the logic used by the hook system. The actual implementation
> is in [.claude/hooks/context-router.sh](../hooks/context-router.sh). This file serves as
> documentation and a template if you want to use an agent-based approach instead of shell scripts.

You are the backend context loader. Analyze the target Python file and load minimal, relevant context.

## Available Context Modules

- **backend-core.md** (always load) - Architecture diagram, layer rules, transaction patterns
- **architecture.md** (load for understanding layer boundaries) - Detailed layer responsibilities, dependencies
- **models.md** (load for models/, migrations/) - SQLAlchemy 2.0 patterns, field definitions, relationships
- **repositories.md** (load for repositories/, services/) - Query patterns, eager loading, "never commit" rule
- **services.md** (load for services/, api/) - Transaction management, domain exceptions, business logic
- **dtos.md** (load for dtos/, api/) - Pydantic validation, DTO templates, from_model() patterns
- **routes.md** (load for api/) - HTTP handling, error mapping, dependency injection
- **migrations.md** (load for database/migrations/) - Alembic patterns, migration operations
- **exceptions.md** (load for services/, api/) - Domain exceptions vs HTTPException

## Decision Logic (Implemented in Shell Script)

This logic is implemented in `.claude/hooks/context-router.sh` which receives file_path via stdin JSON.

```python
if 'app/models/' in file_path:
    return ['backend-core', 'architecture', 'models', 'migrations']

if 'app/repositories/' in file_path:
    return ['backend-core', 'architecture', 'repositories', 'models']

if 'app/services/' in file_path:
    return ['backend-core', 'architecture', 'services', 'repositories', 'exceptions']

if 'app/dtos/' in file_path:
    return ['backend-core', 'dtos', 'models']

if 'app/api/' in file_path:
    return ['backend-core', 'architecture', 'routes', 'dtos', 'exceptions']

if 'database/migrations/' in file_path:
    return ['backend-core', 'migrations', 'models']

if 'app/ai/' in file_path:
    # AI module - load relevant layer context
    if 'services' in file_path:
        return ['backend-core', 'services']
    if 'dtos' in file_path:
        return ['backend-core', 'dtos']

# New feature: load all layers
return ['backend-core', 'architecture', 'models', 'repositories', 'services', 'dtos', 'routes']
```

## Output Format

```
╔═══════════════════════════════════════════════════════════════╗
║ ✅ BACKEND CONTEXT LOADED                                     ║
╠═══════════════════════════════════════════════════════════════╣
║ File: {filePath}                                              ║
║ Layer: {Service|Repository|Model|DTO|Route}                   ║
║                                                               ║
║ Modules loaded ({count}):                                     ║
║   • backend-core.md - Architecture and critical rules         ║
║   • architecture.md - Layer responsibilities                  ║
║   • services.md - Transaction patterns                        ║
║   • repositories.md - Repository interface                    ║
║   • exceptions.md - Domain exception patterns                 ║
║                                                               ║
║ Active rules for this edit:                                   ║
║   → Services handle transactions (commit/rollback)            ║
║   → Repositories never commit (only flush)                    ║
║   → Use domain exceptions, not HTTPException                  ║
║   → Type hints on all signatures                              ║
╚═══════════════════════════════════════════════════════════════╝
```

Context is now loaded and available for the main session.