<#
    Generates a unique release identifier for the current project.
    Updates releaseId in package.json before each Git commit.

    The project name is obtained from package.json.
    No project-specific values are required.

    Author: AMU-Chatia, mar 06/oct/2026
#>

$ErrorActionPreference = "Stop"

try {
    # Resolve the project root dynamically.
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $packageFile = Join-Path $projectRoot "package.json"

    if (-not (Test-Path $packageFile)) {
        throw "package.json was not found."
    }

    # Read the existing project configuration.
    $content = [System.IO.File]::ReadAllText($packageFile)
    $package = $content | ConvertFrom-Json

    if ([string]::IsNullOrWhiteSpace($package.name)) {
        throw "Project name is missing."
    }

    # Generate the release identifier.
    $releaseId = (Get-Date).ToString(
        "yyyy.MM.dd.HHmm",
        [System.Globalization.CultureInfo]::InvariantCulture
    )

    # Prevent duplicate identifiers.
    if ($package.releaseId -eq $releaseId) {
        throw "Release $releaseId already exists."
    }

    $existingTag = & git -C $projectRoot tag --list $releaseId

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read Git tags."
    }

    if ($existingTag -eq $releaseId) {
        throw "Release $releaseId already exists."
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

    # Stage the release identifier for the pending commit.
    & git -C $projectRoot add -- package.json

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to stage package.json."
    }

    Write-Host "Project: $($package.name)"
    Write-Host "Release: $releaseId"
}
catch {
    Write-Error $_
    exit 1
}