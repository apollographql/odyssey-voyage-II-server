param (
    [string]$GraphRef,
    [string]$UrlType,
    [switch]$Help
)

if ($Help) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Publish-Subgraphs.ps1 - Apollo Subgraph Publishing Script" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\Publish-Subgraphs.ps1 [-GraphRef <string>] [-UrlType <local|staging>]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -GraphRef    The graph reference to publish to (e.g. My-Graph-9d4w0e@staging)"
    Write-Host "  -UrlType     The type of routing URLs to use ('local' or 'staging')"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "If parameters are not provided, the script will prompt you for them interactively."
    exit
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Apollo Subgraph Publisher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $GraphRef) {
    $DefaultGraphRef = "My-Graph-9d4w0e@staging"
    $GraphRefInput = Read-Host "Enter your Graph Ref [$DefaultGraphRef]"
    if ([string]::IsNullOrWhiteSpace($GraphRefInput)) {
        $GraphRef = $DefaultGraphRef
    } else {
        $GraphRef = $GraphRefInput
    }
}

if (-not $UrlType) {
    $DefaultUrlType = "staging"
    $UrlTypeInput = Read-Host "Use local or staging URLs? (local/staging) [$DefaultUrlType]"
    if ([string]::IsNullOrWhiteSpace($UrlTypeInput)) {
        $UrlType = $DefaultUrlType
    } else {
        $UrlType = $UrlTypeInput
    }
}

$LocalUrl = ($UrlType -eq "local")

$Subgraphs = @(
    @{ Name = "monolith"; Path = "monolith\schema.graphql"; Port = 4001 },
    @{ Name = "accounts"; Path = "subgraph-accounts\schema.graphql"; Port = 4002 },
    @{ Name = "listings"; Path = "subgraph-listings\schema.graphql"; Port = 4003 },
    @{ Name = "payments"; Path = "subgraph-payments\schema.graphql"; Port = 4004 },
    @{ Name = "reviews"; Path = "subgraph-reviews\schema.graphql"; Port = 4005 },
    @{ Name = "bookings"; Path = "subgraph-bookings\schema.graphql"; Port = 4006 }
)

Write-Host "`nPublishing subgraphs to $GraphRef using $UrlType URLs..." -ForegroundColor Cyan

foreach ($subgraph in $Subgraphs) {
    $Name = $subgraph.Name
    $SchemaPath = ".\$($subgraph.Path)"
    
    if ($LocalUrl) {
        $RoutingUrl = "http://localhost:$($subgraph.Port)"
    } else {
        $RoutingUrl = "https://staging-airlock-$Name.com"
        if ($Name -eq "monolith") {
            $RoutingUrl = "https://staging-airlock-monolith.com"
        }
    }

    Write-Host "`nPublishing $Name subgraph..." -ForegroundColor Yellow
    Write-Host "rover subgraph publish $GraphRef --schema `"$SchemaPath`" --name $Name --routing-url `"$RoutingUrl`"" -ForegroundColor Gray
    
    rover subgraph publish $GraphRef --schema $SchemaPath --name $Name --routing-url $RoutingUrl
}

Write-Host "`nDone!" -ForegroundColor Green
