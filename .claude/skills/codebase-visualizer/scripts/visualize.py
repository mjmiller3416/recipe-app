#!/usr/bin/env python3
"""Generate an interactive collapsible tree visualization of a codebase."""

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
EXCLUDE_PATHS = {'docs', 'tasks', 'frontend/scripts', 'backend/scripts'}


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
    tree = {"name": root.name, "children": [], "size": 0}
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

        # Create/navigate directory nodes
        current = tree
        for i, part in enumerate(parts[:-1]):
            key = "/".join(parts[:i + 1])
            if key not in dirs:
                node = {"name": part, "children": [], "size": 0}
                dirs[key] = node
                current["children"].append(node)
                stats["dirs"] += 1
            current = dirs[key]

        current["children"].append({"name": parts[-1], "size": size, "ext": ext})

        # Propagate sizes
        tree["size"] += size
        for i in range(len(parts) - 1):
            dirs["/".join(parts[:i + 1])]["size"] += size

    return tree


def scan(path: Path, stats: dict, rel: str = "") -> dict:
    """Fallback: walk directory tree with hardcoded ignore list."""
    result = {"name": path.name, "children": [], "size": 0}
    try:
        for item in sorted(path.iterdir()):
            item_rel = f"{rel}/{item.name}" if rel else item.name
            if item.name in IGNORE or is_excluded(item_rel):
                continue
            if item.is_file():
                size = item.stat().st_size
                ext = item.suffix.lower() or '(no ext)'
                result["children"].append({"name": item.name, "size": size, "ext": ext})
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

def generate_html(data: dict, stats: dict, output: Path) -> None:
    ext_sizes = stats["ext_sizes"]
    total_size = sum(ext_sizes.values()) or 1
    sorted_exts = sorted(ext_sizes.items(), key=lambda x: -x[1])[:8]
    colors = {
        '.js': '#f7df1e', '.ts': '#3178c6', '.py': '#3776ab', '.go': '#00add8',
        '.rs': '#dea584', '.rb': '#cc342d', '.css': '#264de4', '.html': '#e34c26',
        '.json': '#6b7280', '.md': '#083fa1', '.yaml': '#cb171e', '.yml': '#cb171e',
        '.mdx': '#083fa1', '.tsx': '#3178c6', '.jsx': '#61dafb', '.sh': '#4eaa25',
    }
    lang_bars = "".join(
        f'<div class="bar-row"><span class="bar-label">{ext}</span>'
        f'<div class="bar" style="width:{(size/total_size)*100}%;background:{colors.get(ext,"#6b7280")}"></div>'
        f'<span class="bar-pct">{(size/total_size)*100:.1f}%</span></div>'
        for ext, size in sorted_exts
    )
    def fmt(b):
        if b < 1024: return f"{b} B"
        if b < 1048576: return f"{b/1024:.1f} KB"
        return f"{b/1048576:.1f} MB"

    html = f'''<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><title>Codebase Explorer</title>
  <style>
    body {{ font: 14px/1.5 system-ui, sans-serif; margin: 0; background: #1a1a2e; color: #eee; }}
    .container {{ display: flex; height: 100vh; }}
    .sidebar {{ width: 280px; background: #252542; padding: 20px; border-right: 1px solid #3d3d5c; overflow-y: auto; flex-shrink: 0; }}
    .main {{ flex: 1; padding: 20px; overflow-y: auto; }}
    h1 {{ margin: 0 0 10px 0; font-size: 18px; }}
    h2 {{ margin: 20px 0 10px 0; font-size: 14px; color: #888; text-transform: uppercase; }}
    .stat {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3d3d5c; }}
    .stat-value {{ font-weight: bold; }}
    .bar-row {{ display: flex; align-items: center; margin: 6px 0; }}
    .bar-label {{ width: 55px; font-size: 12px; color: #aaa; }}
    .bar {{ height: 18px; border-radius: 3px; }}
    .bar-pct {{ margin-left: 8px; font-size: 12px; color: #666; }}
    .tree {{ list-style: none; padding-left: 20px; }}
    details {{ cursor: pointer; }}
    summary {{ padding: 4px 8px; border-radius: 4px; }}
    summary:hover {{ background: #2d2d44; }}
    .folder {{ color: #ffd700; }}
    .file {{ display: flex; align-items: center; padding: 4px 8px; border-radius: 4px; }}
    .file:hover {{ background: #2d2d44; }}
    .size {{ color: #888; margin-left: auto; font-size: 12px; }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }}
  </style>
</head><body>
  <div class="container">
    <div class="sidebar">
      <h1>📊 Summary</h1>
      <div class="stat"><span>Files</span><span class="stat-value">{stats["files"]:,}</span></div>
      <div class="stat"><span>Directories</span><span class="stat-value">{stats["dirs"]:,}</span></div>
      <div class="stat"><span>Total size</span><span class="stat-value">{fmt(data["size"])}</span></div>
      <div class="stat"><span>File types</span><span class="stat-value">{len(stats["extensions"])}</span></div>
      <h2>By file type</h2>
      {lang_bars}
    </div>
    <div class="main">
      <h1>📁 {data["name"]}</h1>
      <ul class="tree" id="root"></ul>
    </div>
  </div>
  <script>
    const data = {json.dumps(data)};
    const colors = {json.dumps(colors)};
    function fmt(b) {{ if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }}
    function render(node, parent) {{
      if (node.children) {{
        const det = document.createElement('details');
        det.open = parent === document.getElementById('root');
        det.innerHTML = `<summary><span class="folder">📁 ${{node.name}}</span><span class="size">${{fmt(node.size)}}</span></summary>`;
        const ul = document.createElement('ul'); ul.className = 'tree';
        node.children.sort((a,b) => (b.children?1:0)-(a.children?1:0) || a.name.localeCompare(b.name));
        node.children.forEach(c => render(c, ul));
        det.appendChild(ul);
        const li = document.createElement('li'); li.appendChild(det); parent.appendChild(li);
      }} else {{
        const li = document.createElement('li'); li.className = 'file';
        li.innerHTML = `<span class="dot" style="background:${{colors[node.ext]||'#6b7280'}}"></span>${{node.name}}<span class="size">${{fmt(node.size)}}</span>`;
        parent.appendChild(li);
      }}
    }}
    data.children.forEach(c => render(c, document.getElementById('root')));
  </script>
</body></html>'''
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