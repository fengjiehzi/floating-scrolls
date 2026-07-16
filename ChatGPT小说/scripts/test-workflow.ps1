$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot = [IO.Path]::GetFullPath((Join-Path $tempBase ('novel-workflow-test-' + [guid]::NewGuid().ToString('N'))))

if (-not $testRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) {
    throw "临时目录越界：$testRoot"
}

New-Item -ItemType Directory -Path $testRoot | Out-Null
try {
    Get-ChildItem -Force -LiteralPath $sourceRoot | Copy-Item -Destination $testRoot -Recurse -Force
    & (Join-Path $testRoot 'scripts\new-chapter.ps1') -Number 7 -Title '雨夜:来客'

    $chapter = Join-Path $testRoot '03_章节\007-雨夜-来客'
    foreach ($name in '任务卡.md', '正文.md', '审稿.md') {
        $path = Join-Path $chapter $name
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            throw "未生成：$path"
        }
        if ((Get-Content -Raw -LiteralPath $path) -match '\{\{章节(编号|标题)\}\}') {
            throw "模板变量未替换：$path"
        }
    }

    & (Join-Path $testRoot 'scripts\check-workflow.ps1')
    Write-Host '完整测试通过：建章、文件名清理、模板替换和项目自检均正常。'
}
finally {
    if ([IO.Path]::GetFullPath($testRoot).StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $testRoot)) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
