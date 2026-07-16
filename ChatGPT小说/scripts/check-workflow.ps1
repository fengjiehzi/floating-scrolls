$root = Split-Path -Parent $PSScriptRoot
$required = @(
    'README.md',
    'AGENTS.md',
    '00_项目管理\项目状态.md',
    '01_小说圣经\小说圣经.md',
    '02_故事规划\故事总纲.md',
    '02_故事规划\连续性台账.md',
    '03_章节\章节模板\任务卡.md',
    '03_章节\章节模板\正文.md',
    '03_章节\章节模板\审稿.md',
    '04_提示词\写章提示词.md',
    '04_提示词\审章提示词.md',
    '05_质量控制\检查清单.md'
)
$errors = [Collections.Generic.List[string]]::new()

foreach ($relativePath in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $root $relativePath) -PathType Leaf)) {
        $errors.Add("缺少必需文件：$relativePath")
    }
}

$chapterRoot = Join-Path $root '03_章节'
Get-ChildItem -LiteralPath $chapterRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object Name -ne '章节模板' |
    ForEach-Object {
        foreach ($name in '任务卡.md', '正文.md', '审稿.md') {
            if (-not (Test-Path -LiteralPath (Join-Path $_.FullName $name) -PathType Leaf)) {
                $errors.Add("章节 $($_.Name) 缺少：$name")
            }
        }
    }

if ($errors.Count) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "工作流自检通过：$($required.Count) 个核心文件完整。"
