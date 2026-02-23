#!/usr/bin/env python3
"""Generate an interactive codebase visualization with file tracking features."""

import json
import subprocess
import sys
import webbrowser
from pathlib import Path
from collections import Counter

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp', '.tiff', '.tif', '.avif', '.heic', '.heif'}
EXCLUDE_EXTS = {'.mjs', '.md', '.ini', '.mako'}
IGNORE = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build', 'public'}
IGNORE_FILES = {'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'Dockerfile'}
EXCLUDE_PATHS = {'docs', 'tasks', 'frontend/scripts', 'backend/scripts', 'backend/app/database/migrations/versions'}
EXT_COLORS = {
    '.js': '#f7df1e', '.ts': '#3178c6', '.py': '#3776ab', '.go': '#00add8',
    '.rs': '#dea584', '.rb': '#cc342d', '.css': '#264de4', '.html': '#e34c26',
    '.json': '#6b7280', '.md': '#083fa1', '.yaml': '#cb171e', '.yml': '#cb171e',
    '.mdx': '#083fa1', '.tsx': '#3178c6', '.jsx': '#61dafb', '.sh': '#4eaa25',
}


def is_excluded(rel: str) -> bool:
    """Check if a relative path should be excluded."""
    parts = Path(rel).parts
    if any(p.startswith('.') for p in parts):
        return True
    if parts[-1] in IGNORE_FILES:
        return True
    ext = Path(parts[-1]).suffix.lower()
    if ext in IMAGE_EXTS or ext in EXCLUDE_EXTS:
        return True
    for i in range(len(parts)):
        if "/".join(parts[:i + 1]) in EXCLUDE_PATHS:
            return True
    return False


def get_git_files(root: Path) -> list[str] | None:
    """Get all non-ignored files using git ls-files."""
    try:
        result = subprocess.run(
            ['git', 'ls-files', '-co', '--exclude-standard'],
            capture_output=True, text=True, cwd=root
        )
        if result.returncode != 0:
            return None
        return [f for f in result.stdout.strip().splitlines() if f]
    except FileNotFoundError:
        return None


def scan_git(root: Path, files: list[str], stats: dict) -> dict:
    """Build tree from git ls-files output, respecting .gitignore."""
    tree = {"name": root.name, "type": "folder", "children": [], "size": 0}
    dirs: dict[str, dict] = {}

    for rel in files:
        if is_excluded(rel):
            continue
        file_path = root / rel
        if not file_path.is_file():
            continue
        ext = file_path.suffix.lower() or '(no ext)'
        size = file_path.stat().st_size
        stats["files"] += 1
        stats["extensions"][ext] += 1
        stats["ext_sizes"][ext] += size

        parts = Path(rel).parts

        current = tree
        for i, part in enumerate(parts[:-1]):
            key = "/".join(parts[:i + 1])
            if key not in dirs:
                node = {"name": part, "type": "folder", "children": [], "size": 0}
                dirs[key] = node
                current["children"].append(node)
                stats["dirs"] += 1
            current = dirs[key]

        current["children"].append({"name": parts[-1], "type": "file", "size": size, "ext": ext})

        tree["size"] += size
        for i in range(len(parts) - 1):
            dirs["/".join(parts[:i + 1])]["size"] += size

    return tree


def scan(path: Path, stats: dict, rel: str = "") -> dict:
    """Fallback: walk directory tree with hardcoded ignore list."""
    result = {"name": path.name, "type": "folder", "children": [], "size": 0}
    try:
        for item in sorted(path.iterdir()):
            item_rel = f"{rel}/{item.name}" if rel else item.name
            if item.name in IGNORE or is_excluded(item_rel):
                continue
            if item.is_file():
                size = item.stat().st_size
                ext = item.suffix.lower() or '(no ext)'
                result["children"].append({"name": item.name, "type": "file", "size": size, "ext": ext})
                result["size"] += size
                stats["files"] += 1
                stats["extensions"][ext] += 1
                stats["ext_sizes"][ext] += size
            elif item.is_dir():
                stats["dirs"] += 1
                child = scan(item, stats, item_rel)
                if child["children"]:
                    result["children"].append(child)
                    result["size"] += child["size"]
    except PermissionError:
        pass
    return result


def fmt_size(b: int) -> str:
    if b < 1024: return f"{b} B"
    if b < 1048576: return f"{b/1024:.1f} KB"
    return f"{b/1048576:.1f} MB"


def generate_html(data: dict, stats: dict, output: Path) -> None:
    """Generate the interactive HTML visualization with tracking features."""

    # --- Compute dynamic values ---
    ext_sizes = stats["ext_sizes"]
    total_size = sum(ext_sizes.values()) or 1
    sorted_exts = sorted(ext_sizes.items(), key=lambda x: -x[1])[:8]
    top_dirs = [c["name"] for c in data.get("children", []) if c.get("type") == "folder"]
    storage_key = f"codebase-tracker-{data['name']}"
    project_name = data["name"]

    # --- Build dynamic HTML fragments ---

    # Progress bars for each top-level directory
    progress_bars = (
        '<div class="progress-bar-wrap" id="progress-overall">'
        '<div class="progress-label"><span>Overall</span><span id="progress-overall-pct">0%</span></div>'
        '<div class="progress-track">'
        '<div class="progress-fill-done" id="progress-overall-done" style="width:0"></div>'
        '<div class="progress-fill-progress" id="progress-overall-progress" style="width:0"></div>'
        '<div class="progress-fill-skipped" id="progress-overall-skipped" style="width:0"></div>'
        '</div></div>\n'
    )
    for d in top_dirs:
        label = d.replace("_", " ").replace("-", " ").title()
        progress_bars += (
            f'<div class="progress-bar-wrap" id="progress-{d}">'
            f'<div class="progress-label"><span>{label}</span><span id="progress-{d}-pct">0%</span></div>'
            f'<div class="progress-track">'
            f'<div class="progress-fill-done" id="progress-{d}-done" style="width:0"></div>'
            f'<div class="progress-fill-progress" id="progress-{d}-progress" style="width:0"></div>'
            f'<div class="progress-fill-skipped" id="progress-{d}-skipped" style="width:0"></div>'
            f'</div></div>\n'
        )

    # Jump nav buttons
    jump_buttons = ""
    for d in top_dirs:
        label = d.replace("_", " ").replace("-", " ").title()
        jump_buttons += f'<button class="btn" onclick="jumpTo(\'{d}\')">{label}</button>\n'

    # Extension stat bars
    ext_bars = ""
    for ext, size in sorted_exts:
        pct = (size / total_size) * 100
        color = EXT_COLORS.get(ext, "#6b7280")
        ext_bars += (
            f'<div class="bar-row"><span class="bar-label">{ext}</span>'
            f'<div class="bar" style="width:{pct}%;background:{color}"></div>'
            f'<span class="bar-pct">{pct:.1f}%</span></div>\n'
        )

    # --- CSS (regular string, no f-string escaping needed) ---
    css = """
:root {
  --bg: #0f1117; --bg-surface: #161822; --bg-hover: #1e2030; --bg-active: #252840;
  --border: #2a2d3e; --text: #e0e0e8; --text-muted: #8888a0; --text-dim: #5c5c78;
  --accent: #7c6ef0; --accent-hover: #9080ff;
  --pending-bg: #2a2d3e; --pending-text: #8888a0;
  --progress-bg: #1a2a4a; --progress-text: #5b9ef5;
  --done-bg: #1a3a2a; --done-text: #4ade80;
  --skipped-bg: #3a2a1a; --skipped-text: #f0a050;
  --search-highlight: #f0d04080;
  --radius: 6px; --transition: 150ms ease;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  background: var(--bg); color: var(--text); line-height: 1.6; font-size: 13px;
}
.header {
  position: sticky; top: 0; z-index: 100;
  background: var(--bg-surface); border-bottom: 1px solid var(--border); padding: 12px 20px;
}
.header-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header h1 { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.header h1 span { color: var(--accent); }
.header-info { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.progress-section { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
.progress-bar-wrap { flex: 1; min-width: 160px; }
.progress-label { font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between; margin-bottom: 3px; }
.progress-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; display: flex; }
.progress-fill-done { background: var(--done-text); transition: width 300ms ease; }
.progress-fill-progress { background: var(--progress-text); transition: width 300ms ease; }
.progress-fill-skipped { background: var(--skipped-text); transition: width 300ms ease; }
.stat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.stat-chip { font-size: 11px; padding: 2px 8px; border-radius: 10px; display: flex; align-items: center; gap: 4px; }
.stat-chip.pending { background: var(--pending-bg); color: var(--pending-text); }
.stat-chip.in-progress { background: var(--progress-bg); color: var(--progress-text); }
.stat-chip.done { background: var(--done-bg); color: var(--done-text); }
.stat-chip.skipped { background: var(--skipped-bg); color: var(--skipped-text); }
.toolbar {
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  padding: 8px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border);
}
.search-box { flex: 1; min-width: 200px; position: relative; }
.search-box input {
  width: 100%; padding: 6px 10px 6px 30px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text);
  font-family: inherit; font-size: 12px; outline: none;
  transition: border-color var(--transition);
}
.search-box input:focus { border-color: var(--accent); }
.search-box .search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--text-dim); font-size: 13px; pointer-events: none; }
.search-box .clear-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 14px; display: none; padding: 2px; }
.search-box .clear-btn.visible { display: block; }
.btn {
  padding: 5px 10px; font-size: 11px; font-family: inherit;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-muted);
  cursor: pointer; transition: all var(--transition); white-space: nowrap;
}
.btn:hover { background: var(--bg-hover); color: var(--text); border-color: var(--accent); }
.btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-group { display: flex; gap: 0; }
.btn-group .btn { border-radius: 0; margin-left: -1px; }
.btn-group .btn:first-child { border-radius: var(--radius) 0 0 var(--radius); margin-left: 0; }
.btn-group .btn:last-child { border-radius: 0 var(--radius) var(--radius) 0; }
.separator { width: 1px; height: 20px; background: var(--border); }
.jump-nav { display: flex; gap: 4px; align-items: center; }
.jump-nav span { font-size: 11px; color: var(--text-dim); margin-right: 4px; }
.ext-panel { padding: 8px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border); display: none; }
.ext-panel.visible { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
.ext-panel-col { flex: 1; min-width: 200px; }
.ext-panel h3 { font-size: 11px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px; }
.bar-row { display: flex; align-items: center; margin: 4px 0; }
.bar-label { width: 55px; font-size: 11px; color: var(--text-muted); }
.bar { height: 14px; border-radius: 3px; min-width: 2px; }
.bar-pct { margin-left: 8px; font-size: 11px; color: var(--text-dim); }
.tree-container { padding: 16px 20px 60px; }
.tree-node { user-select: none; }
.tree-children {
  overflow: hidden; transition: max-height 250ms ease;
  padding-left: 20px; border-left: 1px solid var(--border); margin-left: 8px;
}
.tree-children.collapsed { max-height: 0 !important; }
.tree-row {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 6px; border-radius: var(--radius);
  cursor: default; min-height: 28px; transition: background var(--transition);
}
.tree-row:hover { background: var(--bg-hover); }
.tree-row.search-match { background: var(--search-highlight); }
.tree-row.hidden-by-filter { display: none; }
.toggle-icon {
  width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-dim); font-size: 10px;
  transition: transform 200ms ease; flex-shrink: 0;
}
.toggle-icon.expanded { transform: rotate(90deg); }
.toggle-icon.leaf { visibility: hidden; }
.node-icon { flex-shrink: 0; font-size: 14px; width: 18px; text-align: center; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.node-name { font-size: 13px; white-space: nowrap; }
.node-name.folder { font-weight: 600; color: var(--text); }
.node-name.file { color: var(--text-muted); }
.node-name mark { background: var(--search-highlight); color: var(--text); border-radius: 2px; padding: 0 1px; }
.file-size { font-size: 11px; color: var(--text-dim); white-space: nowrap; }
.folder-size { font-size: 11px; color: var(--text-dim); white-space: nowrap; }
.status-badge {
  font-size: 10px; padding: 1px 8px; border-radius: 8px;
  cursor: pointer; flex-shrink: 0; font-weight: 500;
  transition: all var(--transition); margin-left: auto;
}
.status-badge:hover { filter: brightness(1.3); }
.status-badge.pending { background: var(--pending-bg); color: var(--pending-text); }
.status-badge.in-progress { background: var(--progress-bg); color: var(--progress-text); }
.status-badge.done { background: var(--done-bg); color: var(--done-text); }
.status-badge.skipped { background: var(--skipped-bg); color: var(--skipped-text); }
.note-icon {
  cursor: pointer; font-size: 12px; color: var(--text-dim);
  flex-shrink: 0; opacity: 0; transition: opacity var(--transition); padding: 2px;
}
.tree-row:hover .note-icon { opacity: 1; }
.note-icon.has-note { opacity: 1; color: var(--accent); }
.node-note {
  font-size: 11px; color: var(--accent); cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; max-width: 400px;
}
.node-note:hover { text-decoration: underline; }
.note-input {
  padding: 2px 6px; background: var(--bg); border: 1px solid var(--accent);
  border-radius: var(--radius); color: var(--text); font-family: inherit; font-size: 11px;
  outline: none; min-width: 200px; max-width: 400px;
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 200; display: flex; align-items: center; justify-content: center;
}
.modal-overlay.hidden { display: none; }
.modal {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 20px; width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
}
.modal h2 { font-size: 14px; margin-bottom: 12px; }
.modal textarea {
  width: 100%; min-height: 200px; padding: 10px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text); font-family: inherit; font-size: 12px; outline: none;
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
.toast {
  position: fixed; bottom: 20px; right: 20px;
  background: var(--bg-surface); border: 1px solid var(--done-text);
  color: var(--done-text); padding: 8px 16px;
  border-radius: var(--radius); font-size: 12px; font-family: inherit;
  z-index: 300; opacity: 0; transform: translateY(10px);
  transition: all 300ms ease; pointer-events: none;
}
.toast.visible { opacity: 1; transform: translateY(0); }
.keyboard-hints {
  position: fixed; bottom: 8px; left: 20px; font-size: 10px; color: var(--text-dim);
}
kbd {
  padding: 1px 5px; background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: 3px; font-family: inherit; font-size: 10px;
}
"""

    # --- JavaScript (regular string with placeholder replacement) ---
    js = """
const TREE_DATA = __TREE_DATA__;
const EXT_COLORS = __EXT_COLORS__;
const STORAGE_KEY = "__STORAGE_KEY__";

// State Management
let state = loadState();
let activeFilter = "all";
let searchQuery = "";
let editingNoteId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { statuses: {}, notes: {}, collapsed: {} };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getStatus(path) { return state.statuses[path] || "pending"; }
function setStatus(path, status) { state.statuses[path] = status; saveState(); updateProgress(); }
function getNote(path) { return state.notes[path] || ""; }
function setNote(path, note) { if (note) state.notes[path] = note; else delete state.notes[path]; saveState(); }
function isCollapsed(path) { return state.collapsed[path] === true; }
function setCollapsed(path, val) { if (val) state.collapsed[path] = true; else delete state.collapsed[path]; saveState(); }

// Helpers
function fmt(b) { if (b < 1024) return b + " B"; if (b < 1048576) return (b/1024).toFixed(1) + " KB"; return (b/1048576).toFixed(1) + " MB"; }

function getFileIcon(name, type) {
  if (type === "folder") return "\\u{1F4C1}";
  const ext = name.split(".").pop();
  const map = { py: "\\u{1F40D}", ts: "\\u{1F7E6}", tsx: "\\u{269B}\\uFE0F", js: "\\u{1F7E8}", css: "\\u{1F3A8}", json: "\\u{1F4CB}", ico: "\\u{1F310}" };
  return map[ext] || "\\u{1F4C4}";
}

function buildPath(parentPath, name) { return parentPath ? parentPath + "/" + name : name; }

// Status
const STATUS_CYCLE = ["pending", "in-progress", "done", "skipped"];
const STATUS_LABELS = { pending: "Pending", "in-progress": "In Progress", done: "Done", skipped: "Skipped" };

// Rendering
function renderTree(node, parentPath, container) {
  const path = buildPath(parentPath, node.name);
  const isFolder = node.type === "folder";
  const hasChildren = isFolder && node.children && node.children.length > 0;
  const collapsed = isCollapsed(path);
  const status = getStatus(path);
  const note = getNote(path);

  const nodeEl = document.createElement("div");
  nodeEl.className = "tree-node";
  nodeEl.dataset.path = path;
  nodeEl.dataset.name = node.name.toLowerCase();
  nodeEl.dataset.type = node.type;

  const row = document.createElement("div");
  row.className = "tree-row";
  row.id = "row-" + path.replace(/[^a-zA-Z0-9]/g, "_");

  // Toggle
  const toggle = document.createElement("span");
  toggle.className = "toggle-icon" + (hasChildren ? (collapsed ? "" : " expanded") : " leaf");
  toggle.innerHTML = "\\u25B6";
  if (hasChildren) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const childrenEl = nodeEl.querySelector(":scope > .tree-children");
      const isExp = toggle.classList.contains("expanded");
      if (isExp) {
        childrenEl.style.maxHeight = childrenEl.scrollHeight + "px";
        requestAnimationFrame(() => { childrenEl.classList.add("collapsed"); childrenEl.style.maxHeight = "0"; });
        toggle.classList.remove("expanded");
        setCollapsed(path, true);
      } else {
        childrenEl.classList.remove("collapsed");
        childrenEl.style.maxHeight = childrenEl.scrollHeight + "px";
        setTimeout(() => { childrenEl.style.maxHeight = "none"; }, 260);
        toggle.classList.add("expanded");
        setCollapsed(path, false);
      }
    });
  }
  row.appendChild(toggle);

  // Extension color dot (files only)
  if (!isFolder && node.ext) {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = EXT_COLORS[node.ext] || "#6b7280";
    row.appendChild(dot);
  }

  // Icon
  const icon = document.createElement("span");
  icon.className = "node-icon";
  icon.textContent = getFileIcon(node.name, node.type);
  row.appendChild(icon);

  // Name
  const nameEl = document.createElement("span");
  nameEl.className = "node-name " + (isFolder ? "folder" : "file");
  nameEl.textContent = node.name;
  row.appendChild(nameEl);

  // Size
  if (node.size !== undefined) {
    const sizeEl = document.createElement("span");
    sizeEl.className = isFolder ? "folder-size" : "file-size";
    sizeEl.textContent = fmt(node.size);
    row.appendChild(sizeEl);
  }

  // Inline note display
  if (note && editingNoteId !== path) {
    const noteEl = document.createElement("span");
    noteEl.className = "node-note";
    noteEl.textContent = "// " + note;
    noteEl.title = "Click to edit";
    noteEl.addEventListener("click", (e) => { e.stopPropagation(); toggleNoteEditor(path, nodeEl); });
    row.appendChild(noteEl);
  }

  // Spacer
  const spacer = document.createElement("span");
  spacer.style.flex = "1";
  row.appendChild(spacer);

  // Note icon
  const noteBtn = document.createElement("span");
  noteBtn.className = "note-icon" + (note ? " has-note" : "");
  noteBtn.textContent = note ? "\\u{1F4AC}" : "\\u{1F4AD}";
  noteBtn.title = note ? "Edit note" : "Add note";
  noteBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleNoteEditor(path, nodeEl); });
  row.appendChild(noteBtn);

  // Status badge
  const statusBadge = document.createElement("span");
  statusBadge.className = "status-badge " + status;
  statusBadge.textContent = STATUS_LABELS[status];
  statusBadge.addEventListener("click", (e) => {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(getStatus(path));
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setStatus(path, next);
    statusBadge.className = "status-badge " + next;
    statusBadge.textContent = STATUS_LABELS[next];
    applyFilters();
  });
  row.appendChild(statusBadge);

  nodeEl.appendChild(row);

  // Children
  if (isFolder && node.children) {
    const childrenEl = document.createElement("div");
    childrenEl.className = "tree-children" + (collapsed ? " collapsed" : "");
    if (collapsed) childrenEl.style.maxHeight = "0";
    else childrenEl.style.maxHeight = "none";
    node.children.sort((a, b) => {
      const af = a.type === "folder" ? 0 : 1;
      const bf = b.type === "folder" ? 0 : 1;
      return af - bf || a.name.localeCompare(b.name);
    });
    node.children.forEach(child => renderTree(child, path, childrenEl));
    nodeEl.appendChild(childrenEl);
  }

  container.appendChild(nodeEl);
}

function toggleNoteEditor(path, nodeEl) {
  // Close any existing editor
  const existingInput = document.querySelector(".note-input");
  if (existingInput) { editingNoteId = null; renderAll(); return; }
  if (editingNoteId === path) { editingNoteId = null; renderAll(); return; }
  editingNoteId = path;

  const row = nodeEl.querySelector(":scope > .tree-row");
  // Remove inline note text if present
  const existingNote = row.querySelector(".node-note");
  if (existingNote) existingNote.remove();

  // Insert input inline after the size element (or name if no size)
  const sizeEl = row.querySelector(".file-size, .folder-size");
  const anchor = sizeEl || row.querySelector(".node-name");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "note-input";
  input.value = getNote(path);
  input.placeholder = "Add a note...";
  anchor.after(input);
  input.focus();
  input.select();

  function save() { setNote(path, input.value.trim()); editingNoteId = null; renderAll(); }
  function cancel() { editingNoteId = null; renderAll(); }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  });
  input.addEventListener("blur", () => { save(); });
}

function renderAll() {
  const container = document.getElementById("tree");
  container.innerHTML = "";
  renderTree(TREE_DATA, "", container);
  applyFilters();
  updateProgress();
  highlightSearch();
}

// Progress
function countItems(node, parentPath, section) {
  const path = buildPath(parentPath, node.name);
  const isFile = node.type === "file";
  const counts = { total: 0, done: 0, inProgress: 0, skipped: 0, pending: 0 };
  if (isFile) {
    if (!section || path.startsWith(TREE_DATA.name + "/" + section)) {
      counts.total = 1;
      const s = getStatus(path);
      if (s === "done") counts.done = 1;
      else if (s === "in-progress") counts.inProgress = 1;
      else if (s === "skipped") counts.skipped = 1;
      else counts.pending = 1;
    }
  }
  if (node.children) {
    node.children.forEach(child => {
      const c = countItems(child, path, section);
      counts.total += c.total; counts.done += c.done;
      counts.inProgress += c.inProgress; counts.skipped += c.skipped; counts.pending += c.pending;
    });
  }
  return counts;
}

function updateProgress() {
  const topDirs = TREE_DATA.children.filter(c => c.type === "folder").map(c => c.name);
  const sections = [{ id: "overall", section: null }, ...topDirs.map(d => ({ id: d, section: d }))];
  let overallCounts;

  sections.forEach(({ id, section }) => {
    const c = countItems(TREE_DATA, "", section);
    if (id === "overall") overallCounts = c;
    const t = c.total || 1;
    const el = (s) => document.getElementById("progress-" + id + "-" + s);
    if (el("done")) el("done").style.width = (c.done / t * 100) + "%";
    if (el("progress")) el("progress").style.width = (c.inProgress / t * 100) + "%";
    if (el("skipped")) el("skipped").style.width = (c.skipped / t * 100) + "%";
    const pctEl = document.getElementById("progress-" + id + "-pct");
    if (pctEl) pctEl.textContent = Math.round((c.done + c.skipped) / t * 100) + "% (" + (c.done + c.skipped) + "/" + c.total + ")";
  });

  const chips = document.getElementById("stat-chips");
  if (chips && overallCounts) {
    chips.innerHTML =
      '<span class="stat-chip pending">' + overallCounts.pending + ' pending</span>' +
      '<span class="stat-chip in-progress">' + overallCounts.inProgress + ' in progress</span>' +
      '<span class="stat-chip done">' + overallCounts.done + ' done</span>' +
      '<span class="stat-chip skipped">' + overallCounts.skipped + ' skipped</span>';
  }
}

// Search & Filtering
const searchInput = document.getElementById("search");
const searchClear = document.getElementById("search-clear");
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.toLowerCase().trim();
  searchClear.classList.toggle("visible", searchQuery.length > 0);
  highlightSearch(); applyFilters();
});

function clearSearch() {
  searchInput.value = ""; searchQuery = "";
  searchClear.classList.remove("visible");
  highlightSearch(); applyFilters();
}

function highlightSearch() {
  document.querySelectorAll(".tree-row").forEach(row => {
    row.classList.remove("search-match");
    const nameEl = row.querySelector(".node-name");
    if (!nameEl) return;
    const original = nameEl.textContent;
    nameEl.innerHTML = nameEl.textContent;
    if (searchQuery && original.toLowerCase().includes(searchQuery)) {
      row.classList.add("search-match");
      const regex = new RegExp("(" + searchQuery.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + ")", "gi");
      nameEl.innerHTML = original.replace(regex, "<mark>$1</mark>");
      expandParents(row);
    }
  });
}

function expandParents(el) {
  let parent = el.closest(".tree-children");
  while (parent) {
    if (parent.classList.contains("collapsed")) {
      parent.classList.remove("collapsed");
      parent.style.maxHeight = "none";
      const toggle = parent.parentElement.querySelector(":scope > .tree-row .toggle-icon");
      if (toggle) toggle.classList.add("expanded");
      const path = parent.parentElement.dataset.path;
      if (path) setCollapsed(path, false);
    }
    parent = parent.parentElement.closest(".tree-children");
  }
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll(".btn-group .btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  applyFilters();
}

function applyFilters() {
  document.querySelectorAll(".tree-node").forEach(nodeEl => {
    const path = nodeEl.dataset.path;
    const type = nodeEl.dataset.type;
    const row = nodeEl.querySelector(":scope > .tree-row");
    if (!row) return;
    let visible = true;
    if (activeFilter !== "all" && type === "file") {
      visible = getStatus(path) === activeFilter;
    }
    if (searchQuery && type !== "folder") {
      const name = nodeEl.dataset.name || "";
      if (!name.includes(searchQuery)) visible = false;
    }
    if (type === "file") row.classList.toggle("hidden-by-filter", !visible);
  });
  if (activeFilter !== "all" || searchQuery) {
    document.querySelectorAll('.tree-node[data-type="folder"]').forEach(folderEl => {
      const row = folderEl.querySelector(":scope > .tree-row");
      if (!row) return;
      const folderName = folderEl.dataset.name || "";
      const matchesSearch = searchQuery && folderName.includes(searchQuery);
      const visibleFiles = folderEl.querySelectorAll('.tree-node[data-type="file"] > .tree-row:not(.hidden-by-filter)');
      row.classList.toggle("hidden-by-filter", !matchesSearch && visibleFiles.length === 0);
    });
  }
}

// Expand / Collapse
function expandAll() {
  document.querySelectorAll(".tree-children").forEach(el => { el.classList.remove("collapsed"); el.style.maxHeight = "none"; });
  document.querySelectorAll(".toggle-icon:not(.leaf)").forEach(el => el.classList.add("expanded"));
  state.collapsed = {}; saveState();
}
function collapseAll() {
  document.querySelectorAll(".tree-children").forEach(el => { el.classList.add("collapsed"); el.style.maxHeight = "0"; });
  document.querySelectorAll(".toggle-icon").forEach(el => el.classList.remove("expanded"));
  document.querySelectorAll('.tree-node[data-type="folder"]').forEach(el => { if (el.dataset.path) state.collapsed[el.dataset.path] = true; });
  saveState();
}

// Jump nav
function jumpTo(section) {
  const path = TREE_DATA.name + "/" + section;
  const id = "row-" + path.replace(/[^a-zA-Z0-9]/g, "_");
  const el = document.getElementById(id);
  if (el) {
    expandParents(el);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.style.background = "var(--accent)";
    setTimeout(() => { el.style.background = ""; }, 1500);
  }
}

// Extension stats panel toggle
function toggleExtStats() {
  const panel = document.getElementById("ext-panel");
  panel.classList.toggle("visible");
}

// Export / Import / Reset
function exportState() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "codebase-tracker-export.json"; a.click();
  URL.revokeObjectURL(url);
  showToast("Exported tracking data");
}
function showImportModal() {
  document.getElementById("import-modal").classList.remove("hidden");
  document.getElementById("import-data").value = "";
  document.getElementById("import-data").focus();
}
function closeImportModal() { document.getElementById("import-modal").classList.add("hidden"); }
function importState() {
  try {
    const data = JSON.parse(document.getElementById("import-data").value);
    if (data.statuses && data.notes) {
      state = data;
      if (!state.collapsed) state.collapsed = {};
      saveState(); renderAll(); closeImportModal();
      showToast("Imported tracking data");
    } else { alert("Invalid format. Expected {statuses, notes} object."); }
  } catch (e) { alert("Invalid JSON: " + e.message); }
}
function resetState() {
  if (confirm("Reset all statuses, notes, and collapse states? This cannot be undone.")) {
    state = { statuses: {}, notes: {}, collapsed: {} };
    saveState(); editingNoteId = null; renderAll();
    showToast("All tracking data reset");
  }
}

// Toast
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg; toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "f" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
  else if (e.key === "e" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); expandAll(); }
  else if (e.key === "E" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); collapseAll(); }
  else if (e.key === "Escape") {
    if (editingNoteId) { editingNoteId = null; renderAll(); }
    else { clearSearch(); }
    closeImportModal();
  }
});

// Init
document.querySelector('[data-filter="all"]').classList.add("active");
renderAll();
"""

    # Perform replacements
    js = js.replace('__TREE_DATA__', json.dumps(data))
    js = js.replace('__EXT_COLORS__', json.dumps(EXT_COLORS))
    js = js.replace('__STORAGE_KEY__', storage_key)

    # --- Assemble full HTML ---
    html = (
        '<!DOCTYPE html>\n'
        '<html lang="en">\n'
        '<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        f'<title>{project_name} — Codebase Explorer</title>\n'
        f'<style>{css}</style>\n'
        '</head>\n'
        '<body>\n'
        '\n'
        '<div class="header">\n'
        '  <div class="header-top">\n'
        f'    <h1><span>&#9781;</span> {project_name} — Codebase Explorer</h1>\n'
        '    <div class="header-info">\n'
        f'      <span>{stats["files"]:,} files &middot; {stats["dirs"]:,} dirs &middot; {fmt_size(data["size"])}</span>\n'
        '      <button class="btn" onclick="exportState()" title="Export tracking data">Export</button>\n'
        '      <button class="btn" onclick="showImportModal()" title="Import tracking data">Import</button>\n'
        '      <button class="btn" onclick="resetState()" title="Reset all" style="color:#f87171">Reset</button>\n'
        '    </div>\n'
        '  </div>\n'
        '  <div class="progress-section">\n'
        f'    {progress_bars}\n'
        '    <div class="stat-chips" id="stat-chips"></div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div class="toolbar">\n'
        '  <div class="search-box">\n'
        '    <span class="search-icon">&#128269;</span>\n'
        '    <input type="text" id="search" placeholder="Search files and folders..." autocomplete="off" />\n'
        '    <button class="clear-btn" id="search-clear" onclick="clearSearch()">&#10005;</button>\n'
        '  </div>\n'
        '  <div class="separator"></div>\n'
        '  <button class="btn" onclick="expandAll()">Expand All</button>\n'
        '  <button class="btn" onclick="collapseAll()">Collapse All</button>\n'
        '  <div class="separator"></div>\n'
        '  <div class="btn-group">\n'
        '    <button class="btn" data-filter="all" onclick="setFilter(\'all\', this)">All</button>\n'
        '    <button class="btn" data-filter="pending" onclick="setFilter(\'pending\', this)">Pending</button>\n'
        '    <button class="btn" data-filter="in-progress" onclick="setFilter(\'in-progress\', this)">In Progress</button>\n'
        '    <button class="btn" data-filter="done" onclick="setFilter(\'done\', this)">Done</button>\n'
        '    <button class="btn" data-filter="skipped" onclick="setFilter(\'skipped\', this)">Skipped</button>\n'
        '  </div>\n'
        '  <div class="separator"></div>\n'
        f'  <button class="btn" onclick="toggleExtStats()">&#128202; File Types</button>\n'
        '  <div class="separator"></div>\n'
        '  <div class="jump-nav">\n'
        '    <span>Jump:</span>\n'
        f'    {jump_buttons}\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div class="ext-panel" id="ext-panel">\n'
        '  <div class="ext-panel-col">\n'
        '    <h3>By file type (size)</h3>\n'
        f'    {ext_bars}\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div class="tree-container" id="tree"></div>\n'
        '\n'
        '<div class="modal-overlay hidden" id="import-modal">\n'
        '  <div class="modal">\n'
        '    <h2>Import Tracking Data</h2>\n'
        '    <textarea id="import-data" placeholder="Paste exported JSON here..."></textarea>\n'
        '    <div class="modal-actions">\n'
        '      <button class="btn" onclick="closeImportModal()">Cancel</button>\n'
        '      <button class="btn" style="border-color:var(--done-text);color:var(--done-text)" onclick="importState()">Import</button>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>\n'
        '\n'
        '<div class="toast" id="toast"></div>\n'
        '\n'
        '<div class="keyboard-hints">\n'
        '  <kbd>Ctrl+F</kbd> Search &nbsp; <kbd>Ctrl+E</kbd> Expand All &nbsp; <kbd>Ctrl+Shift+E</kbd> Collapse All &nbsp; <kbd>Esc</kbd> Clear\n'
        '</div>\n'
        '\n'
        f'<script>{js}</script>\n'
        '</body>\n'
        '</html>\n'
    )

    output.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    target = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
    stats = {"files": 0, "dirs": 0, "extensions": Counter(), "ext_sizes": Counter()}
    git_files = get_git_files(target)
    if git_files is not None:
        data = scan_git(target, git_files, stats)
    else:
        data = scan(target, stats)
    out = Path('codebase-map.html')
    generate_html(data, stats, out)
    print(f'Generated {out.absolute()}')
    webbrowser.open(f'file://{out.absolute()}')
