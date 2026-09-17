param(
    [string]$GoldenSetPath = (Join-Path $PSScriptRoot 'golden-set.json'),
    [string]$ChatlogPath = (Join-Path $PSScriptRoot '..\data\vlearn-pack\chatlog\tutor_turns.csv'),
    [string]$TranscriptDirectory = (Join-Path $PSScriptRoot '..\data\vlearn-pack\transcript')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "VALIDATION FAILED: $Message"
    }
}

$data = Get-Content -LiteralPath $GoldenSetPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cases = @($data.cases)

Assert-True -Condition ($cases.Count -ge 20) -Message "Golden set needs at least 20 cases; found $($cases.Count)."
Assert-True -Condition ((@($cases.id | Select-Object -Unique)).Count -eq $cases.Count) -Message 'Case ids must be unique.'

$regularCount = @($cases | Where-Object difficulty_band -eq 'regular').Count
$rareCount = @($cases | Where-Object difficulty_band -eq 'rare').Count
$chatlogCount = @($cases | Where-Object { $_.origin.type -eq 'chatlog_adapted' }).Count

Assert-True -Condition ($regularCount -ge 8 -and $regularCount -le 10) -Message "Need 8-10 regular cases; found $regularCount."
Assert-True -Condition ($rareCount -ge 2 -and $rareCount -le 4) -Message "Need 2-4 rare cases; found $rareCount."
Assert-True -Condition ($chatlogCount -ge 10) -Message "Need at least 10 chatlog-derived cases; found $chatlogCount."

$requiredLayers = @(
    'L1_source_of_truth',
    'L2_ambiguous_or_missing_input',
    'L3_out_of_scope_or_authority',
    'L4_domain_specific_misconception'
)

foreach ($layer in $requiredLayers) {
    $layerCount = @($cases | Where-Object primary_hard_layer -eq $layer).Count
    Assert-True -Condition ($layerCount -ge 2) -Message "Layer $layer needs at least 2 cases; found $layerCount."
}

$routes = @($cases | ForEach-Object { @($_.expected_behavior.route_to) } | Select-Object -Unique)
foreach ($agent in @('teaching_assistant_agent', 'socratic_tutor', 'artifact_agent')) {
    Assert-True -Condition ($routes -contains $agent) -Message "No case routes to $agent."
}

$knownTurnIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
Import-Csv -LiteralPath $ChatlogPath -Encoding UTF8 | ForEach-Object {
    [void]$knownTurnIds.Add($_.turn_id)
}

foreach ($case in $cases | Where-Object { $_.origin.type -eq 'chatlog_adapted' }) {
    $turnIds = @($case.origin.turn_ids)
    Assert-True -Condition ($turnIds.Count -gt 0) -Message "Case $($case.id) is chatlog_adapted but has no turn_id."
    foreach ($turnId in $turnIds) {
        Assert-True -Condition ($knownTurnIds.Contains([string]$turnId)) -Message "Case $($case.id) references missing turn_id: $turnId."
    }
}

$transcriptText = Get-ChildItem -LiteralPath $TranscriptDirectory -Filter '*-clean.md' |
    ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 }
$allTranscriptText = $transcriptText -join "`n"

foreach ($case in $cases) {
    foreach ($ref in @($case.context.allowed_evidence_refs)) {
        Assert-True -Condition ($allTranscriptText.Contains("[$ref]")) -Message "Case $($case.id) references missing transcript id: $ref."
    }
}

Write-Host 'Golden set is valid.' -ForegroundColor Green
Write-Host "Total: $($cases.Count) | regular: $regularCount | hard: $(@($cases | Where-Object difficulty_band -eq 'hard').Count) | rare: $rareCount | chatlog-derived: $chatlogCount"
foreach ($layer in $requiredLayers) {
    $layerCount = @($cases | Where-Object primary_hard_layer -eq $layer).Count
    Write-Host "$layer`: $layerCount"
}
