#Requires -Version 5.1
<#
.SYNOPSIS
  Test blog generation: backend health, n8n webhook, and/or FastAPI generate endpoint.

.DESCRIPTION
  Loads Backend\.env by default, sends a sample BlogRequest payload, and reports
  status, duration, and response body (or a clear error if the body is empty).

.PARAMETER Target
  What to call: Health, N8n, Api, or All (default).

.PARAMETER EnvFile
  Path to .env file with N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET, etc.

.PARAMETER ApiBaseUrl
  FastAPI base URL (default http://localhost:8000). Overrides VITE_API_BASE_URL from env if set.

.PARAMETER TimeoutSeconds
  Request timeout (default 120; match N8N_TIMEOUT_SECONDS).

.EXAMPLE
  .\scripts\test-blog-flow.ps1

.EXAMPLE
  .\scripts\test-blog-flow.ps1 -Target N8n

.EXAMPLE
  .\scripts\test-blog-flow.ps1 -Target Api -ApiBaseUrl http://localhost:8000
#>

[CmdletBinding()]
param(
    [ValidateSet('Health', 'N8n', 'Api', 'All')]
    [string] $Target = 'All',

    [string] $EnvFile = '',

    [string] $ApiBaseUrl = '',

    [int] $TimeoutSeconds = 120
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    $dir = $PSScriptRoot
    while ($dir) {
        if (Test-Path (Join-Path $dir 'Backend')) {
            return $dir
        }
        $parent = Split-Path $dir -Parent
        if ($parent -eq $dir) { break }
        $dir = $parent
    }
    throw 'Could not find repo root (expected Backend folder). Run from the Blog-Generation repo.'
}

function Read-DotEnv {
    param([string] $Path)

    $vars = @{}
    if (-not (Test-Path $Path)) {
        Write-Warning "Env file not found: $Path"
        return $vars
    }

    Get-Content -Path $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $vars[$key] = $value
    }
    return $vars
}

function Write-Section {
    param([string] $Title)
    Write-Host ''
    Write-Host ('=' * 72) -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ('=' * 72) -ForegroundColor DarkGray
}

function Get-SamplePayload {
    @{
        title              = 'The Future of AI in Healthcare 2026'
        primary_keywords   = @('ai', 'healthcare', 'machine learning')
        secondary_keywords = @('diagnostics', 'clinical')
        target_audience    = 'Healthcare IT professionals'
        tone               = 'professional'
        length             = 'short'
        language           = 'english'
        additional_context = $null
    }
}

function Invoke-FlowRequest {
    param(
        [string] $Label,
        [string] $Uri,
        [hashtable] $Headers,
        [object] $Body,
        [int] $TimeoutSec
    )

    $jsonBody = $Body | ConvertTo-Json -Depth 10 -Compress
    Write-Host "POST $Uri"
    Write-Host "Payload: $jsonBody"

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest `
            -Uri $Uri `
            -Method POST `
            -Headers $Headers `
            -ContentType 'application/json; charset=utf-8' `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody)) `
            -TimeoutSec $TimeoutSec `
            -UseBasicParsing
    }
    catch {
        $sw.Stop()
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            $secs = '{0:F1}' -f $sw.Elapsed.TotalSeconds
            Write-Host "FAILED ($Label) - HTTP $statusCode in ${secs}s" -ForegroundColor Red
            if ($errBody) {
                Write-Host 'Response body:'
                Write-Host $errBody
            }
            return @{ Ok = $false; StatusCode = $statusCode; Body = $errBody; Elapsed = $sw.Elapsed }
        }
        Write-Host "FAILED ($Label) - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Ok = $false; StatusCode = 0; Body = $_.Exception.Message; Elapsed = $sw.Elapsed }
    }

    $sw.Stop()
    $raw = $response.Content
    $status = [int]$response.StatusCode

    $secs = '{0:F1}' -f $sw.Elapsed.TotalSeconds
    $statusColor = if ($status -ge 200 -and $status -lt 300) { 'Green' } else { 'Yellow' }
    Write-Host "HTTP $status in ${secs}s" -ForegroundColor $statusColor

    if ([string]::IsNullOrWhiteSpace($raw)) {
        Write-Host 'Response body is EMPTY.' -ForegroundColor Red
        $emptyHint = @(
            'This usually means:'
            '  - N8N_WEBHOOK_URL is the n8n Test URL instead of Production'
            '  - The workflow is not Active, or failed before Respond to Webhook'
            '  - Wrong webhook path / instance'
            ''
            'Fix: use Production URL from the Webhook node, activate the workflow, check n8n Executions.'
        ) -join [Environment]::NewLine
        Write-Host $emptyHint -ForegroundColor Yellow
        return @{ Ok = $false; StatusCode = $status; Body = ''; Elapsed = $sw.Elapsed }
    }

    Write-Host 'Response body:'
    try {
        $parsed = $raw | ConvertFrom-Json
        $parsed | ConvertTo-Json -Depth 20 | Write-Host

        if ($parsed.blog) {
            $preview = $parsed.blog
            if ($preview.Length -gt 400) {
                $preview = $preview.Substring(0, 400) + '...'
            }
            Write-Host ''
            Write-Host 'Blog preview:' -ForegroundColor Green
            Write-Host $preview
            Write-Host ''
            Write-Host "word_count: $($parsed.word_count) | sources: $($parsed.sources.Count)" -ForegroundColor Green
        }
        elseif ($parsed.detail) {
            Write-Host "API detail: $($parsed.detail)" -ForegroundColor Yellow
        }

        $hasBlog = [bool]$parsed.blog
        return @{ Ok = $hasBlog; StatusCode = $status; Body = $raw; Parsed = $parsed; Elapsed = $sw.Elapsed }
    }
    catch {
        Write-Host $raw
        Write-Host "Body is not valid JSON: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Ok = $false; StatusCode = $status; Body = $raw; Elapsed = $sw.Elapsed }
    }
}

function Test-Health {
    param([string] $BaseUrl)

    $uri = "$( $BaseUrl.TrimEnd('/') )/api/v1/health"
    Write-Host "GET $uri"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $r = Invoke-RestMethod -Uri $uri -Method GET -TimeoutSec 30
        $sw.Stop()
        $secs = '{0:F1}' -f $sw.Elapsed.TotalSeconds
        Write-Host "OK in ${secs}s" -ForegroundColor Green
        $r | ConvertTo-Json | Write-Host
        return $true
    }
    catch {
        $sw.Stop()
        Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host 'Start the backend: cd Backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000'
        return $false
    }
}

# --- main ---
$repoRoot = Get-RepoRoot
if (-not $EnvFile) {
    $EnvFile = Join-Path $repoRoot 'Backend\.env'
}

$envVars = Read-DotEnv -Path $EnvFile
$n8nUrl = $envVars['N8N_WEBHOOK_URL']
$n8nSecret = $envVars['N8N_WEBHOOK_SECRET']

if (-not $ApiBaseUrl) {
    $ApiBaseUrl = $envVars['VITE_API_BASE_URL']
    if (-not $ApiBaseUrl) {
        $ApiBaseUrl = 'http://localhost:8000'
    }
}

Write-Host "Repo:    $repoRoot"
Write-Host "Env:     $EnvFile"
Write-Host "API:     $ApiBaseUrl"
Write-Host "n8n URL: $(if ($n8nUrl) { $n8nUrl } else { '(not set)' })"
Write-Host "Secret:  $(if ($n8nSecret) { '***' + $n8nSecret.Substring([Math]::Max(0, $n8nSecret.Length - 4)) } else { '(not set)' })"
Write-Host "Target:  $Target | Timeout: ${TimeoutSeconds}s"

$payload = Get-SamplePayload
$results = @{}

if ($Target -eq 'All' -or $Target -eq 'Health') {
    Write-Section '1. Backend health'
    $results['Health'] = Test-Health -BaseUrl $ApiBaseUrl
}

if ($Target -eq 'All' -or $Target -eq 'N8n') {
    Write-Section '2. n8n webhook (direct)'
    if (-not $n8nUrl -or -not $n8nSecret) {
        Write-Host 'Skip: set N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET in Backend\.env' -ForegroundColor Yellow
        $results['N8n'] = $false
    }
    else {
        $headers = @{ 'x-webhook-secret' = $n8nSecret }
        $r = Invoke-FlowRequest -Label 'n8n' -Uri $n8nUrl -Headers $headers -Body $payload -TimeoutSec $TimeoutSeconds
        $results['N8n'] = $r.Ok
        if ($r.Elapsed.TotalSeconds -lt 5 -and -not $r.Ok) {
            Write-Host 'Hint: response under 5s with empty body often means Test URL or workflow did not finish.' -ForegroundColor Yellow
        }
    }
}

if ($Target -eq 'All' -or $Target -eq 'Api') {
    Write-Section '3. FastAPI POST /api/v1/blog/generate'
    $uri = "$( $ApiBaseUrl.TrimEnd('/') )/api/v1/blog/generate"
    $r = Invoke-FlowRequest -Label 'API' -Uri $uri -Headers @{} -Body $payload -TimeoutSec $TimeoutSeconds
    $results['Api'] = $r.Ok
}

Write-Section 'Summary'
foreach ($key in $results.Keys) {
    $icon = if ($results[$key]) { '[PASS]' } else { '[FAIL]' }
    $color = if ($results[$key]) { 'Green' } else { 'Red' }
    Write-Host "$icon $key" -ForegroundColor $color
}

$failed = @($results.Values | Where-Object { -not $_ }).Count
if ($failed -gt 0) {
    exit 1
}
exit 0
