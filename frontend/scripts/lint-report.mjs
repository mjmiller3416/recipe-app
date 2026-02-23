#!/usr/bin/env node

/**
 * Runs ESLint and generates a markdown report grouped by rule.
 *
 * Usage:
 *   node scripts/lint-report.mjs                      # lint all, write to lint-report.md
 *   node scripts/lint-report.mjs -o custom.md         # lint all, write to custom.md
 *   node scripts/lint-report.mjs file1.ts file2.tsx   # lint specific files only
 *   node scripts/lint-report.mjs -o out.md src/app.ts # lint specific file, custom output
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const outIdx = args.indexOf("-o");
const outFile =
  outIdx !== -1 && args[outIdx + 1]
    ? resolve(args[outIdx + 1])
    : resolve(ROOT, "..", "tasks", "lint-report.md");

// Collect file arguments (everything that's not -o or its value)
const fileArgs = args.filter((arg, i) => {
  if (arg === "-o") return false;
  if (i > 0 && args[i - 1] === "-o") return false;
  return true;
});

// ---------------------------------------------------------------------------
// Run ESLint with JSON output
// ---------------------------------------------------------------------------
// If specific files provided, lint only those; otherwise lint entire project
const eslintTarget = fileArgs.length > 0 ? fileArgs.map((f) => `"${f}"`).join(" ") : ".";
const eslintCmd = `npx eslint -f json ${eslintTarget}`;

let raw;
try {
  raw = execSync(eslintCmd, {
    cwd: ROOT,
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024, // 50 MB
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch (err) {
  // ESLint exits with code 1 when there are warnings/errors — that's fine
  if (err.stdout) {
    raw = err.stdout;
  } else {
    console.error("ESLint failed unexpectedly:", err.message);
    process.exit(2);
  }
}

const results = JSON.parse(raw);

// ---------------------------------------------------------------------------
// Group messages by rule
// ---------------------------------------------------------------------------
/** @type {Map<string, { severity: number, messages: Array<{file: string, line: number, column: number, message: string, severity: number}> }>} */
const byRule = new Map();

let totalErrors = 0;
let totalWarnings = 0;
let filesWithIssues = 0;

for (const file of results) {
  if (file.messages.length === 0) continue;
  filesWithIssues++;

  const filePath = relative(ROOT, file.filePath).replace(/\\/g, "/");

  for (const msg of file.messages) {
    const ruleId = msg.ruleId || "parse-error";
    if (msg.severity === 2) totalErrors++;
    else totalWarnings++;

    if (!byRule.has(ruleId)) {
      byRule.set(ruleId, { errors: 0, warnings: 0, messages: [] });
    }
    const bucket = byRule.get(ruleId);
    if (msg.severity === 2) bucket.errors++;
    else bucket.warnings++;

    bucket.messages.push({
      file: filePath,
      line: msg.line,
      column: msg.column,
      message: msg.message,
      severity: msg.severity,
    });
  }
}

// Sort rules: errors first, then by total count descending
const sortedRules = [...byRule.entries()].sort((a, b) => {
  const aErrs = a[1].errors;
  const bErrs = b[1].errors;
  if (bErrs !== aErrs) return bErrs - aErrs;
  return b[1].messages.length - a[1].messages.length;
});

// ---------------------------------------------------------------------------
// Build markdown
// ---------------------------------------------------------------------------
const lines = [];
const now = new Date().toLocaleString("en-US", { dateStyle: "short", timeStyle: "medium" });

lines.push("# ESLint Report");
lines.push("");
lines.push(`> Generated on ${now}`);
lines.push("");

// Overview
lines.push("## Overview");
lines.push("");
lines.push(`| Metric | Count |`);
lines.push(`| ------ | ----- |`);
lines.push(`| Total files scanned | ${results.length} |`);
lines.push(`| Files with issues | ${filesWithIssues} |`);
lines.push(`| Errors | ${totalErrors} |`);
lines.push(`| Warnings | ${totalWarnings} |`);
lines.push(`| Rules triggered | ${byRule.size} |`);
lines.push("");

if (sortedRules.length === 0) {
  lines.push("**No issues found.**");
} else {
  // Summary table
  lines.push("## Summary by Rule");
  lines.push("");
  lines.push("| # | Rule | Errors | Warnings | Total |");
  lines.push("| - | ---- | ------ | -------- | ----- |");
  sortedRules.forEach(([ruleId, data], i) => {
    lines.push(
      `| ${i + 1} | \`${ruleId}\` | ${data.errors} | ${data.warnings} | ${data.messages.length} |`
    );
  });
  lines.push("");

  // Detail sections per rule
  lines.push("## Details");
  lines.push("");
  for (const [ruleId, data] of sortedRules) {
    const counts = [];
    if (data.errors) counts.push(`${data.errors} error${data.errors > 1 ? "s" : ""}`);
    if (data.warnings) counts.push(`${data.warnings} warning${data.warnings > 1 ? "s" : ""}`);

    lines.push(`### \`${ruleId}\` (${counts.join(", ")})`);
    lines.push("");
    lines.push("| File | Line:Col | Severity | Message |");
    lines.push("| ---- | -------- | -------- | ------- |");

    for (const m of data.messages) {
      const sev = m.severity === 2 ? "error" : "warning";
      // Truncate to first line only — ESLint verbose messages can span many lines
      const shortMsg = m.message.split("\n")[0].trim();
      const escapedMsg = shortMsg.replace(/\|/g, "\\|");
      lines.push(`| ${m.file} | ${m.line}:${m.column} | ${sev} | ${escapedMsg} |`);
    }
    lines.push("");
  }
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const md = lines.join("\n");
writeFileSync(outFile, md, "utf-8");

const relOut = relative(process.cwd(), outFile);
console.log(
  `Lint report written to ${relOut}  (${totalErrors} errors, ${totalWarnings} warnings, ${byRule.size} rules)`
);

// Exit 1 if any errors OR warnings found (block on all lint issues)
process.exit(totalErrors + totalWarnings > 0 ? 1 : 0);
