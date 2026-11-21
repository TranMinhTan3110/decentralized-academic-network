# Script: sync_all_to_pinata.ps1
# Dong bo toan bo tai lieu chua co tren Pinata tu Local IPFS Kubo len Pinata Cloud

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  IPFS PINATA BATCH SYNC TOOL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Doc JWT tu .env hoac bien moi truong
$jwt = $env:PINATA_JWT
if (-not $jwt) {
    $envPath = "services\document-service\.env"
    if (Test-Path $envPath) {
        $envLines = Get-Content $envPath
        foreach ($line in $envLines) {
            if ($line.Trim().StartsWith("PINATA_JWT=")) {
                $jwt = $line.Trim().Substring("PINATA_JWT=".Length).Trim()
                if ($jwt.StartsWith('"') -and $jwt.EndsWith('"')) {
                    $jwt = $jwt.Substring(1, $jwt.Length - 2)
                }
                break
            }
        }
    }
}

if (-not $jwt) {
    Write-Host "[ERROR] Khong tim thay PINATA_JWT trong .env hoac bien moi truong!" -ForegroundColor Red
    exit 1
}

# 2. Lay danh sach documents chua duoc pin len Pinata tu PostgreSQL
Write-Host "[1/3] Dang lay danh sach tai lieu lech pha tu Database..." -ForegroundColor Yellow
$query = "COPY (SELECT id, replace(title, ' ', '_'), ipfs_cid, coalesce(file_extension, 'pdf') FROM documents WHERE is_pinned_remote = false) TO STDOUT WITH CSV DELIMITER '|';"
$docsCsv = docker exec dev_postgres_db psql -U root -d document_db -t -c $query

$docs = @()
foreach ($line in ($docsCsv -split "`r?`n")) {
    $line = $line.Trim()
    if ($line) {
        $parts = $line.Split("|")
        if ($parts.Count -ge 4) {
            $docs += [PSCustomObject]@{
                Id = $parts[0]
                Title = $parts[1]
                Cid = $parts[2]
                Ext = $parts[3]
            }
        }
    }
}

Write-Host "  -> Tim thay $($docs.Count) tai lieu can dong bo len Pinata." -ForegroundColor Green
if ($docs.Count -eq 0) {
    Write-Host "[OK] Tat ca tai lieu da duoc dong bo voi Pinata. Khong can xu ly tiep." -ForegroundColor Cyan
    exit 0
}

# 3. Lap qua tung document, lay tu Kubo va upload len Pinata
Write-Host "[2/3] Bat dau dong bo tung file tu Local Kubo len Pinata Cloud..." -ForegroundColor Yellow
$tempDir = Join-Path $env:TEMP "pinata_sync"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

$successCount = 0
$failCount = 0
$index = 0

foreach ($doc in $docs) {
    $index++
    $safeFilename = "$($doc.Title).$($doc.Ext)" -replace '[^\w\.-]', '_'
    $tempFile = Join-Path $tempDir "$($doc.Cid)_$safeFilename"
    
    Write-Host "[$index/$($docs.Count)] Dang dong bo: $($doc.Title) (CID: $($doc.Cid))... " -NoNewline
    
    # Lay file tu Kubo
    & curl.exe -s -X POST "http://localhost:5001/api/v0/cat?arg=$($doc.Cid)" -o $tempFile
    if (-not (Test-Path $tempFile) -or (Get-Item $tempFile).Length -eq 0) {
        Write-Host "[THAT BAI - File rong/khong lay duoc tu Kubo]" -ForegroundColor Red
        $failCount++
        continue
    }

    # Upload len Pinata
    $uploadRes = & curl.exe -s -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" `
        -H "Authorization: Bearer $jwt" `
        -F "file=@$tempFile;filename=$safeFilename"

    # Xoa file tam
    Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue

    if ($uploadRes -match '"IpfsHash"') {
        # Cap nhat DB
        docker exec dev_postgres_db psql -U root -d document_db -c "UPDATE documents SET is_pinned_remote = true WHERE id = '$($doc.Id)';" | Out-Null
        Write-Host "[THANH CONG]" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "[THAT BAI: $uploadRes]" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[3/3] HOAN TAT DONG BO!" -ForegroundColor Cyan
Write-Host "  - Thanh cong: $successCount" -ForegroundColor Green
Write-Host "  - That bai  : $failCount" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor Cyan
