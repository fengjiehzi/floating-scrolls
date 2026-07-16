param(
    [Parameter(Mandatory)]
    [ValidateRange(1, 9999)]
    [int]$Number,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Title
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$templateDir = Join-Path $root '03_章节\章节模板'
$safeTitle = $Title.Trim() -replace "[$([regex]::Escape(-join [IO.Path]::GetInvalidFileNameChars()))]", '-' -replace '\s+', '-'
$chapterNumber = '{0:D3}' -f $Number
$chapterDir = Join-Path $root "03_章节\$chapterNumber-$safeTitle"

if (Test-Path -LiteralPath $chapterDir) {
    throw "章节目录已存在：$chapterDir"
}

New-Item -ItemType Directory -Path $chapterDir | Out-Null
foreach ($name in '任务卡.md', '正文.md', '审稿.md') {
    $content = Get-Content -Raw -LiteralPath (Join-Path $templateDir $name)
    $content = $content.Replace('{{章节编号}}', $chapterNumber).Replace('{{章节标题}}', $Title.Trim())
    Set-Content -LiteralPath (Join-Path $chapterDir $name) -Value $content -Encoding utf8
}

Write-Host "已创建：$chapterDir"
Write-Host '下一步：填写任务卡.md；完成前不要生成正文。'
