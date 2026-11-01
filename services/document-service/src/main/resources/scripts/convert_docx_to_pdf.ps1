param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'

try {
    # 1. Thử dùng Microsoft Word COM Automation
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($InputPath, $false, $true)
    $doc.ExportAsFixedFormat($OutputPath, 17) # 17 = wdExportFormatPDF
    $doc.Close([ref]$false)
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    if (Test-Path $OutputPath) {
        exit 0
    }
} catch {
    # Nếu có lỗi, kiểm tra LibreOffice headless làm fallback
    try {
        $outDir = Split-Path -Parent $OutputPath
        & soffice --headless --convert-to pdf --outdir $outDir $InputPath
        if (Test-Path $OutputPath) {
            exit 0
        }
    } catch {}
    Write-Error $_.Exception.Message
    exit 1
}
