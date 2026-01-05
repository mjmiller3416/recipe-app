# batch-audit.ps1
# ============================================
# CONFIGURE THESE TO CONTROL WHAT GETS AUDITED
# ============================================

# Option A: Glob pattern (audit all .tsx files in a folder)
$pattern = "frontend/src/components/ui/*.tsx"

# Option B: Explicit file list (uncomment and edit to use instead)
# $explicitFiles = @(
#     "frontend/src/components/ui/button.tsx",
#     "frontend/src/components/ui/input.tsx",
#     "frontend/src/components/ui/select.tsx"
# )

# Output location for audit reports
$outputDir = "audit-results"

# Mode: "audit" (report only) or "fix" (audit + auto-resolve)
$mode = "fix"

# ============================================
# SCRIPT (no need to edit below)
# ============================================

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Use explicit list if defined, otherwise use glob pattern
if ($explicitFiles) {
    $files = $explicitFiles | ForEach-Object { Get-Item $_ }
} else {
    $files = Get-ChildItem -Path $pattern
}

$fileCount = $files.Count

if ($fileCount -eq 0) {
    Write-Host "`nNo files found matching pattern: $pattern`n" -ForegroundColor Red
    exit 1
}

$modeLabel = if ($mode -eq "fix") { "AUDIT + FIX" } else { "AUDIT ONLY" }
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BATCH $modeLabel - $fileCount files queued" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$current = 0
foreach ($file in $files) {
    $current++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host "[$current/$fileCount] $timestamp - $($file.Name)" -ForegroundColor Yellow

    if ($mode -eq "fix") {
        # Run /implement which audits AND applies fixes
        Write-Host "         [~] Auditing and fixing..." -ForegroundColor Cyan
        claude "/implement $($file.FullName)" 2>&1 | Out-File -FilePath "$outputDir/$($file.BaseName)-audit.md" -Encoding UTF8
    } else {
        # Run /audit for report only
        claude "/audit $($file.FullName)" 2>&1 | Out-File -FilePath "$outputDir/$($file.BaseName)-audit.md" -Encoding UTF8
    }

    if ($LASTEXITCODE -eq 0) {
        $actionLabel = if ($mode -eq "fix") { "Fixed & saved" } else { "Saved" }
        Write-Host "         [OK] $actionLabel to $($file.BaseName)-audit.md" -ForegroundColor Green
    } else {
        Write-Host "         [X] Error processing file" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  COMPLETE - Results in: $outputDir/" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# List generated files
Get-ChildItem -Path $outputDir -Filter "*.md" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}
Write-Host ""
