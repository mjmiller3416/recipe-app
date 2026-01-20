# batch-audit.ps1
# ============================================
# CONFIGURE THESE TO CONTROL WHAT GETS AUDITED
# ============================================

# Option A: Glob pattern (audit all .tsx files in a folder)
# Use -Recurse below to include subdirectories
# $pattern = "frontend/src/app/meal-planner"
# $filter = "*.tsx"
# $recurse = $true

# Option B: Explicit file list (uncomment and edit to use instead)
$explicitFiles = @(
    "frontend/src/components/meal-genie/MealGenieAssistant.tsx",
    "frontend/src/components/meal-genie/MealGenieChatContent.tsx",
    "frontend/src/components/meal-genie/MealGeniePopup.tsx"
)

# Output location for audit reports
$outputDir = "audit-results"

# Mode: "audit" (report only) or "fix" (audit + auto-resolve)
# - "audit" = runs /audit, outputs violation report only
# - "fix"   = runs /ds-fix, finds violations AND applies fixes to files
$mode = "fix"

# ============================================
# SCRIPT (no need to edit below)
# ============================================

# Progress bar helper function
function Write-ProgressBar {
    param (
        [int]$Current,
        [int]$Total,
        [string]$Phase,
        [datetime]$StartTime,
        [int]$SuccessCount = 0,
        [int]$ErrorCount = 0
    )

    $percent = [math]::Round(($Current / $Total) * 100)
    $barWidth = 30
    $filled = [math]::Floor(($Current / $Total) * $barWidth)
    $empty = $barWidth - $filled
    $bar = ("█" * $filled) + ("░" * $empty)

    # Calculate elapsed and ETA
    $elapsed = (Get-Date) - $StartTime
    $elapsedStr = "{0:mm\:ss}" -f $elapsed

    if ($Current -gt 0) {
        $avgPerFile = $elapsed.TotalSeconds / $Current
        $remaining = ($Total - $Current) * $avgPerFile
        $eta = [TimeSpan]::FromSeconds($remaining)
        $etaStr = "{0:mm\:ss}" -f $eta
    } else {
        $etaStr = "--:--"
    }

    # Build status line
    $statusLine = "  $Phase [$bar] $percent% | $Current/$Total | Elapsed: $elapsedStr | ETA: $etaStr"
    if ($SuccessCount -gt 0 -or $ErrorCount -gt 0) {
        $statusLine += " | OK: $SuccessCount"
        if ($ErrorCount -gt 0) {
            $statusLine += " ERR: $ErrorCount"
        }
    }

    # Write progress (overwrite same line)
    Write-Host "`r$statusLine" -NoNewline -ForegroundColor Cyan
}

# Create output directory
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

# Use explicit list if defined, otherwise use glob pattern
if ($explicitFiles) {
    $files = $explicitFiles | ForEach-Object { Get-Item $_ }
} elseif ($recurse) {
    $files = Get-ChildItem -Path $pattern -Filter $filter -Recurse
} else {
    $files = Get-ChildItem -Path $pattern -Filter $filter
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
$successCount = 0
$errorCount = 0
$fixStartTime = Get-Date

foreach ($file in $files) {
    $current++

    # Show current file
    Write-Host "`n  Processing: $($file.Name)" -ForegroundColor Yellow

    if ($mode -eq "fix") {
        claude "/ds-fix $($file.FullName)" 2>&1 | Out-File -FilePath "$outputDir/$($file.BaseName)-audit.md" -Encoding UTF8
    } else {
        claude "/audit $($file.FullName)" 2>&1 | Out-File -FilePath "$outputDir/$($file.BaseName)-audit.md" -Encoding UTF8
    }

    if ($LASTEXITCODE -eq 0) {
        $successCount++
        Write-Host "  [OK] $($file.BaseName)-audit.md" -ForegroundColor Green
    } else {
        $errorCount++
        Write-Host "  [X] Error processing file" -ForegroundColor Red
    }

    # Update progress bar
    Write-ProgressBar -Current $current -Total $fileCount -Phase "FIX " -StartTime $fixStartTime -SuccessCount $successCount -ErrorCount $errorCount
}

# Clear progress line and show completion
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  COMPLETE - Results in: $outputDir/" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# List generated files
Get-ChildItem -Path $outputDir -Filter "*.md" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

# ============================================
# VERIFICATION PASS (only after fix mode)
# ============================================
if ($mode -eq "fix") {
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  VERIFICATION PASS - Checking fixes..." -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta

    $verifyDir = "$outputDir/verify"
    New-Item -ItemType Directory -Force -Path $verifyDir | Out-Null

    $cleanCount = 0
    $dirtyCount = 0
    $current = 0
    $verifyStartTime = Get-Date

    foreach ($file in $files) {
        $current++

        # Show current file
        Write-Host "`n  Verifying: $($file.Name)" -ForegroundColor Yellow

        $verifyOutput = claude "/audit $($file.FullName)" 2>&1
        $verifyOutput | Out-File -FilePath "$verifyDir/$($file.BaseName)-verify.md" -Encoding UTF8

        # Check if output contains "no violation" (case-insensitive)
        if ($verifyOutput -match "no violation|clean|no issues") {
            Write-Host "  [OK] Clean" -ForegroundColor Green
            $cleanCount++
        } else {
            Write-Host "  [!] Has violations - see verify/$($file.BaseName)-verify.md" -ForegroundColor Yellow
            $dirtyCount++
        }

        # Update progress bar
        Write-ProgressBar -Current $current -Total $fileCount -Phase "VERIFY" -StartTime $verifyStartTime -SuccessCount $cleanCount -ErrorCount $dirtyCount
    }

    # Calculate total elapsed time
    $totalElapsed = (Get-Date) - $fixStartTime
    $totalElapsedStr = "{0:mm\:ss}" -f $totalElapsed

    Write-Host "`n"
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  VERIFICATION COMPLETE" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "  Clean:      $cleanCount / $fileCount" -ForegroundColor Green
    if ($dirtyCount -gt 0) {
        Write-Host "  Remaining:  $dirtyCount / $fileCount" -ForegroundColor Yellow
    }
    Write-Host "  Total time: $totalElapsedStr" -ForegroundColor Cyan
    Write-Host ""
    if ($dirtyCount -gt 0) {
        Write-Host "  Re-run script to fix remaining violations." -ForegroundColor Yellow
    } else {
        Write-Host "  All files are compliant!" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host ""
