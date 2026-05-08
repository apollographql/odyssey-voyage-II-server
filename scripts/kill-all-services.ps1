$ErrorActionPreference = "SilentlyContinue"

$root = (Resolve-Path "$PSScriptRoot\..").Path
$clientPath = Join-Path (Split-Path $root -Parent) "odyssey-voyage-II-client"
$currentPid = $PID

function Get-ExistingPath {
  param([string]$Path)

  if (Test-Path $Path) {
    return (Resolve-Path $Path).Path
  }

  return $Path
}

function Get-ProcessTable {
  Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $currentPid }
}

function Get-PortOwningProcessIds {
  param([int[]]$Ports)

  $portSet = @{}
  foreach ($port in $Ports) {
    $portSet[[string]$port] = $true
  }

  $ids = @()
  $lines = netstat -ano

  foreach ($line in $lines) {
    if ($line -notmatch "^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$") {
      continue
    }

    $port = $Matches[1]
    $id = [int]$Matches[2]

    if ($portSet.ContainsKey($port)) {
      $ids += $id
    }
  }

  return $ids | Sort-Object -Unique
}

function Add-ProcessTree {
  param(
    [int[]]$RootIds,
    [object[]]$ProcessTable
  )

  $allIds = New-Object System.Collections.Generic.HashSet[int]
  $queue = New-Object System.Collections.Generic.Queue[int]

  foreach ($id in $RootIds) {
    if ($id -and $allIds.Add($id)) {
      $queue.Enqueue($id)
    }
  }

  while ($queue.Count -gt 0) {
    $id = $queue.Dequeue()
    $children = $ProcessTable | Where-Object { $_.ParentProcessId -eq $id }

    foreach ($child in $children) {
      if ($child.ProcessId -ne $currentPid -and $allIds.Add([int]$child.ProcessId)) {
        $queue.Enqueue([int]$child.ProcessId)
      }
    }
  }

  return $allIds.ToArray()
}

function Add-Ancestors {
  param(
    [int[]]$LeafIds,
    [object[]]$ProcessTable
  )

  $allIds = New-Object System.Collections.Generic.List[int]

  foreach ($leafId in $LeafIds) {
    $process = $ProcessTable | Where-Object { $_.ProcessId -eq $leafId } | Select-Object -First 1

    while ($process) {
      $parent = $ProcessTable | Where-Object { $_.ProcessId -eq $process.ParentProcessId } | Select-Object -First 1

      if (-not $parent) {
        break
      }

      $parentCommand = $parent.CommandLine
      $parentName = $parent.Name

      if ($parent.ProcessId -eq $currentPid -or
          $parentName -eq "Code.exe" -or
          $parentName -eq "OpenConsole.exe" -or
          $parentCommand -like "*shellIntegration.ps1*") {
        break
      }

      $allIds.Add([int]$parent.ProcessId)
      $process = $parent
    }
  }

  return $allIds.ToArray()
}

function Get-ProcessIdsForTarget {
  param(
    [hashtable]$Target,
    [object[]]$ProcessTable
  )

  $ids = @()

  $ids += Get-PortOwningProcessIds -Ports $Target.Ports

  foreach ($process in $ProcessTable) {
    $commandLine = $process.CommandLine
    if (-not $commandLine) {
      continue
    }

    $matchesPath = $false
    foreach ($path in $Target.Paths) {
      if ($commandLine -like "*$path*") {
        $matchesPath = $true
        break
      }
    }

    if ($matchesPath) {
      $ids += $process.ProcessId
      continue
    }

    if ($Target.ContainsKey("Extra") -and $Target.Extra.Invoke($process)) {
      $ids += $process.ProcessId
    }
  }

  return $ids | Where-Object { $_ -and $_ -ne $currentPid } | Sort-Object -Unique
}

$targets = @(
  @{
    Name = "9. Client"
    Ports = @(3000)
    Paths = @((Get-ExistingPath $clientPath))
  },
  @{
    Name = "8. Router"
    Ports = @(4000)
    Paths = @($root)
    Extra = {
      param($process)
      ($process.Name -like "rover*" -or $process.CommandLine -like "*rover dev*") -and $process.CommandLine -like "*$root*"
    }
  },
  @{
    Name = "7. Bookings Subgraph"
    Ports = @(4006)
    Paths = @((Get-ExistingPath (Join-Path $root "subgraph-bookings")))
  },
  @{
    Name = "6. Payments Subgraph"
    Ports = @(4004)
    Paths = @((Get-ExistingPath (Join-Path $root "subgraph-payments")))
  },
  @{
    Name = "5. Reviews Subgraph"
    Ports = @(4005)
    Paths = @((Get-ExistingPath (Join-Path $root "subgraph-reviews")))
  },
  @{
    Name = "4. Listings Subgraph"
    Ports = @(4003)
    Paths = @((Get-ExistingPath (Join-Path $root "subgraph-listings")))
  },
  @{
    Name = "3. Accounts Subgraph"
    Ports = @(4002)
    Paths = @((Get-ExistingPath (Join-Path $root "subgraph-accounts")))
  },
  @{
    Name = "2. Monolith Subgraph"
    Ports = @(4001)
    Paths = @((Get-ExistingPath (Join-Path $root "monolith")))
  },
  @{
    Name = "1. REST Services"
    Ports = @(4010, 4011)
    Paths = @(
      (Get-ExistingPath (Join-Path $root "services\accounts")),
      (Get-ExistingPath (Join-Path $root "services\listings")),
      (Get-ExistingPath (Join-Path $root "monolith"))
    )
    Extra = {
      param($process)
      $process.CommandLine -like "*$root*services\accounts*" -or
        $process.CommandLine -like "*$root*services\listings*" -or
        $process.CommandLine -like "*$root*monolith*utils\launch.js*"
    }
  }
)

foreach ($target in $targets) {
  Write-Host "Stopping $($target.Name)..."

  $processTable = @(Get-ProcessTable)
  $rootIds = @(Get-ProcessIdsForTarget -Target $target -ProcessTable $processTable)
  $treeIds = @(Add-ProcessTree -RootIds $rootIds -ProcessTable $processTable)
  $ancestorIds = @(Add-Ancestors -LeafIds @($rootIds + $treeIds) -ProcessTable $processTable)
  $idsToStop = @($treeIds + $rootIds + $ancestorIds) | Where-Object { $_ -and $_ -ne $currentPid } | Select-Object -Unique

  foreach ($id in $idsToStop) {
    Write-Host "  Stop PID $id"
    Stop-Process -Id $id -Force
  }
}

Write-Host "Done."
