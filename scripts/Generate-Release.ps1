<#
    Generates a release identifier when a version is ready for QA.

    Workflow:
    1. Development commits do not generate release identifiers.
    2. The identifier is generated manually on the preview branch.
    3. The approved identifier is preserved when promoting to main.
    4. Official Git tags are created only on main.

    Format: yyyy.MM.dd.HHmm

    Author: AMU-Chatia, lun 12/oct/2026
#>

$ErrorActionPreference = "Stop"

try {
    # Resolve the project root dynamically.
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $packageFile = Join-Path $projectRoot "package.json"

    if (-not (Test-Path $packageFile)) {
        throw "package.json was not found."
    }

    # Identify the active Git branch.
    $branch = (& git -C $projectRoot branch --show-current).Trim()

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to identify the current Git branch."
    }

    # Release identifiers can only be generated on preview.
    if ($branch -ne "preview") {
        throw "Release generation is only allowed on the preview branch. Current branch: $branch"
    }

    # Read the existing project configuration.
    $content = [System.IO.File]::ReadAllText($packageFile)
    $package = $content | ConvertFrom-Json

    if ([string]::IsNullOrWhiteSpace($package.name)) {
        throw "Project name is missing."
    }

    # Prevent overwriting a version with uncommitted changes to package.json.
    & git -C $projectRoot diff --quiet HEAD -- package.json

    if ($LASTEXITCODE -ne 0) {
        throw "package.json has uncommitted changes. Review them before generating a QA version."
    }

    # Generate a unique QA identifier.
    $releaseId = (Get-Date).ToString(
        "yyyy.MM.dd.HHmm",
        [System.Globalization.CultureInfo]::InvariantCulture
    )

    if ($package.releaseId -eq $releaseId) {
        throw "Version $releaseId is already assigned."
    }

    # Verify that no official Git tag already uses this identifier.
    $existingTag = & git -C $projectRoot tag --list $releaseId

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read Git tags."
    }

    if ($existingTag -eq $releaseId) {
        throw "Version $releaseId already exists as a Git tag."
    }

    # Update only releaseId, preserving the rest of package.json.
    $pattern = '("releaseId"\s*:\s*")[^"]*(")'

    if ([regex]::Matches($content, $pattern).Count -ne 1) {
        throw "Expected exactly one releaseId property."
    }

    $replacement = '${1}' + $releaseId + '${2}'

    $updatedContent = [regex]::Replace(
        $content,
        $pattern,
        $replacement
    )

    # Save as UTF-8 without BOM.
    $encoding = [System.Text.UTF8Encoding]::new($false)

    [System.IO.File]::WriteAllText(
        $packageFile,
        $updatedContent,
        $encoding
    )

    # Stage the QA identifier for the next commit.
    & git -C $projectRoot add -- package.json

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to stage package.json."
    }

    Write-Host "Project: $($package.name)"
    Write-Host "Branch: $branch"
    Write-Host "QA version: $releaseId"
    Write-Host "Version staged. Commit and push when QA deployment is approved."
}
catch {
    Write-Error $_
    exit 1
}