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

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BATCH AUDIT - $fileCount files queued" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$current = 0
foreach ($file in $files) {
    $current++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host "[$current/$fileCount] $timestamp - $($file.Name)" -ForegroundColor Yellow

    # Run the existing /audit command for each file
    claude "/audit $($file.FullName)" 2>&1 | Out-File -FilePath "$outputDir/$($file.BaseName)-audit.md" -Encoding UTF8

    if ($LASTEXITCODE -eq 0) {
        Write-Host "         [OK] Saved to $($file.BaseName)-audit.md" -ForegroundColor Green
    } else {
        Write-Host "         [X] Error auditing file" -ForegroundColor Red
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
