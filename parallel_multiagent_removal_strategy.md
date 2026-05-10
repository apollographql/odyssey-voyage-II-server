# Parallel Multi-Agent Strategy: Monolith Removal
> **Source Plan:** `monolith_removal_plan.md`  
> **Strategy Type:** Parallel Multi-Agent Execution  
> **Platform:** Windows (PowerShell + pnpm)  
> **Skills Available:** `apollo-federation`, `apollo-router`, `rover`, `apollo-server`, `graphql-schema`, `graphql-operations`  
> **Total Agents:** 4  
> **Estimated Wall-Clock Time:** ~2–4 hours (remaining work only)  

---

## Phase 0: What Has Already Been Done ✅

A full audit of the repository confirms that **Steps 1, 2, and 3** of the original plan are **complete**. No agent needs to repeat this work.

| Original Step | Status | Evidence |
|---|---|---|
| Step 1 — Audit monolith schema/resolvers | ✅ Done | Original plan exists; all subgraphs built |
| Step 2 — Migrate schema & resolvers | ✅ Done | All 5 subgraphs have full `schema.graphql` + `resolvers.js` |
| Step 3a — Migrate datasources | ✅ Done | Each subgraph has its own `datasources/<name>.js` |
| Step 3b — Copy `errors.js` to all subgraphs | ✅ Done | `utils/errors.js` present in all 5 subgraphs |
| Step 3c — Move launch scripts to `scripts/` | ⚠️ Partial | `scripts/kill-all-services.ps1` exists; `launch.js`, `install.js`, `reset.js`, `package-manager.js` still only in `monolith/utils/` |

### Remaining Work Summary

```
subgraph-accounts\schema.graphql   → @override(from: "monolith") on 11 fields
subgraph-listings\schema.graphql   → @override(from: "monolith") on 22 fields
subgraph-bookings\schema.graphql   → @override(from: "monolith") on 16 fields
subgraph-reviews\schema.graphql    → @override(from: "monolith") on 14 fields
subgraph-payments\schema.graphql   → @override(from: "monolith") on  6 fields
router\supergraph-config.yaml      → monolith block still present (port 4001)
Start-Apollo.ps1                   → Steps 1 & 2 still reference monolith
Publish-Subgraphs.ps1              → monolith entry still in $Subgraphs array
scripts\                           → launch/install/reset scripts not yet moved here
```

---

## Dependency Graph (Remaining Work Only)

```
  ┌────────────────────────────────────────────────────────────────┐
  │  PARALLEL PHASE 1 (no blocking dependencies between agents)    │
  │                                                                │
  │  Agent-1              Agent-2              Agent-3             │
  │  @override cleanup    @override cleanup    Infrastructure      │
  │  accounts + listings  bookings+reviews     router + scripts    │
  │                       + payments           + PS1 scripts       │
  └──────────┬────────────────────┬────────────────────┬──────────┘
             │                    │                    │
             └────────────────────┴────────────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  PHASE 2           │
                        │  Agent-4           │
                        │  Validation Gate   │
                        │  + GraphOS delete  │
                        └─────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  PHASE 3           │
                        │  Agent-1 (or any)  │
                        │  Delete monolith   │
                        │  + git commit      │
                        └────────────────────┘
```

---

## Agent Assignments

### Agent-1 — `@override` Cleanup: `accounts` + `listings`

**Skill:** `apollo-federation` (`.agents\skills\apollo-federation\SKILL.md`)  
**Duration:** ~30–45 min  
**Files touched:** `subgraph-accounts\schema.graphql`, `subgraph-listings\schema.graphql`

#### Task: Remove all `@override(from: "monolith")` directives

**`subgraph-accounts\schema.graphql`** — Remove from these locations:
- `Query.user`
- `Query.me`
- `Mutation.updateProfile`
- `Host.name`, `Host.profilePicture`, `Host.profileDescription`
- `Guest.name`, `Guest.profilePicture`
- `UpdateProfileResponse.code`, `.success`, `.message`, `.user`

After removal, also remove `"@override"` from the `@link` import list (line 4) since no overrides remain.

**`subgraph-listings\schema.graphql`** — Remove from:
- `Query.featuredListings`, `.searchListings`, `.hostListings`, `.listing`, `.listingAmenities`
- `Mutation.createListing`, `.updateListing`
- All fields on `Listing`, `Amenity`, `UpdateListingResponse`, `CreateListingResponse`

After removal, remove `"@override"` from the `@link` import list.

#### Validate with Rover (Windows PowerShell)

```powershell
# From repo root — validate each schema composes correctly
rover subgraph lint --name accounts .\subgraph-accounts\schema.graphql
rover subgraph lint --name listings .\subgraph-listings\schema.graphql
```

> Per the `rover` skill: use `rover subgraph check` against your graph ref before publishing.  
> Per the `apollo-federation` skill: after removing `@override`, re-import only the directives actually used.

#### Exit Condition
- Zero `@override(from: "monolith")` instances in either file
- `@link` import list updated to remove `"@override"`
- `rover subgraph lint` passes with no errors

---

### Agent-2 — `@override` Cleanup: `bookings` + `reviews` + `payments`

**Skill:** `apollo-federation` (`.agents\skills\apollo-federation\SKILL.md`)  
**Duration:** ~45–60 min  
**Files touched:** `subgraph-bookings\schema.graphql`, `subgraph-reviews\schema.graphql`, `subgraph-payments\schema.graphql`

#### Task: Remove all `@override(from: "monolith")` directives

**`subgraph-bookings\schema.graphql`** — Remove from:
- All `Query.*` fields (bookingsForListing, guestBookings, pastGuestBookings, upcomingGuestBookings, currentGuestBooking)
- `Mutation.createBooking`
- All fields on `Booking`, `NewBookingResponse`, `CreateBookingResponse`

Also remove `"@external"` from the `@link` import if it is not actually used on any field post-cleanup.

**`subgraph-reviews\schema.graphql`** — Remove from:
- `Mutation.submitHostAndLocationReviews`, `.submitGuestReview`
- `Host.overallRating`, `Listing.reviews`, `Listing.overallRating`
- All fields on `Review`, `SubmitHostAndLocationReviewsResponse`, `SubmitGuestReviewResponse`

**`subgraph-payments\schema.graphql`** — Remove from:
- `Mutation.addFundsToWallet`
- All fields on `AddFundsToWalletResponse`
- `Guest.funds`

After each file, remove `"@override"` from the `@link` import list.

#### Validate with Rover (Windows PowerShell)

```powershell
rover subgraph lint --name bookings  .\subgraph-bookings\schema.graphql
rover subgraph lint --name reviews   .\subgraph-reviews\schema.graphql
rover subgraph lint --name payments  .\subgraph-payments\schema.graphql
```

#### Exit Condition
- Zero `@override(from: "monolith")` instances in all three files
- `@link` imports trimmed to only directives still in use
- All three `rover subgraph lint` calls pass

---

### Agent-3 — Infrastructure Cleanup

**Skills:** `apollo-router` + `rover` (`.agents\skills\apollo-router\SKILL.md`, `.agents\skills\rover\SKILL.md`)  
**Duration:** ~45–60 min  
**Files touched:** `router\supergraph-config.yaml`, `Start-Apollo.ps1`, `Publish-Subgraphs.ps1`, `scripts\` (new files)

#### Task A — Remove monolith from `router\supergraph-config.yaml`

Delete the entire `monolith:` block. Result should be:

```yaml
federation_version: =2.7.0
subgraphs:
  accounts:
    routing_url: http://localhost:4002
    schema:
      file: ..\subgraph-accounts\schema.graphql
  listings:
    routing_url: http://localhost:4003
    schema:
      file: ..\subgraph-listings\schema.graphql
  payments:
    routing_url: http://localhost:4004
    schema:
      file: ..\subgraph-payments\schema.graphql
  reviews:
    routing_url: http://localhost:4005
    schema:
      file: ..\subgraph-reviews\schema.graphql
  bookings:
    routing_url: http://localhost:4006
    schema:
      file: ..\subgraph-bookings\schema.graphql
```

> Per the `apollo-router` skill: Windows paths in `supergraph-config.yaml` use backslashes (`..\\`) or forward slashes — either works with Rover on Windows.

#### Task B — Move launch scripts to `scripts\`

Copy from `monolith\utils\` → `scripts\`:

```powershell
Copy-Item monolith\utils\launch.js          scripts\launch-services.js
Copy-Item monolith\utils\install.js         scripts\install-services.js
Copy-Item monolith\utils\reset.js           scripts\reset-services.js
Copy-Item monolith\utils\package-manager.js scripts\package-manager.js
```

Then update the `cwd` paths inside `scripts\launch-services.js`. Change any relative path like `./services/...` to be relative to the **repo root** (where the script will now run), e.g.:

```js
// Before (relative to monolith/)
{ cwd: './services/accounts' }

// After (relative to repo root)
{ cwd: './services/accounts' }  // ← only valid if monolith/ held a services/ symlink
// Or use absolute path anchored to __dirname:
{ cwd: path.join(__dirname, '..', 'services', 'accounts') }
```

Verify `services\accounts`, `services\listings`, and `services\bookings` exist at the repo root.

#### Task C — Update `Start-Apollo.ps1`

Replace the monolith-specific sections. Full updated version:

```powershell
# Start-Apollo.ps1 - Starts all Apollo Voyage II services (monolith removed)
# Run from: F:\DEV\apollo\odyssey-voyage-II-server

$RootServer = "F:\DEV\apollo\odyssey-voyage-II-server"
$RootClient = "F:\DEV\apollo\odyssey-voyage-II-client"

function Start-ServiceWindow {
  param ([string]$Title, [string]$WorkingDir, [string]$Command)
  Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$WorkingDir'; `$host.UI.RawUI.WindowTitle = '$Title'; $Command"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Apollo Voyage II - Starting Up..."    -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: REST backing services (accounts @ 4011, listings @ 4010)
Write-Host "[1/5] Starting REST services (ports 4010, 4011)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "REST Services" `
  -WorkingDir "$RootServer" `
  -Command "node scripts\launch-services.js"

Write-Host "      Waiting 4s for REST services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# Step 2: Accounts subgraph (port 4002)
Write-Host "[2/5] Starting subgraph-accounts (port 4002)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Subgraph-Accounts (4002)" `
  -WorkingDir "$RootServer\subgraph-accounts" `
  -Command "pnpm start"

Start-Sleep -Seconds 2

# Step 3: Listings subgraph (port 4003)
Write-Host "[3/5] Starting subgraph-listings (port 4003)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Subgraph-Listings (4003)" `
  -WorkingDir "$RootServer\subgraph-listings" `
  -Command "pnpm start"

Write-Host "      Waiting 3s for subgraphs to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Step 4: rover dev - Router (port 4000)
Write-Host "[4/5] Starting rover dev / Router (port 4000)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Rover Dev / Router (4000)" `
  -WorkingDir "$RootServer" `
  -Command "rover dev --supergraph-config .\router\supergraph-config.yaml --router-config .\router\router-config.yaml"

Start-Sleep -Seconds 2

# Step 5: Client (port 3000)
Write-Host "[5/5] Starting client (port 3000)..." -ForegroundColor Yellow
Start-ServiceWindow -Title "Client (3000)" `
  -WorkingDir "$RootClient" `
  -Command "pnpm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All services starting!"               -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  REST services : http://127.0.0.1:4010 (listings)"  -ForegroundColor White
Write-Host "                  http://127.0.0.1:4011 (accounts)"  -ForegroundColor White
Write-Host "  Accounts GQL  : http://localhost:4002"             -ForegroundColor White
Write-Host "  Listings GQL  : http://localhost:4003"             -ForegroundColor White
Write-Host "  Router        : http://localhost:4000  <-- query here" -ForegroundColor Cyan
Write-Host "  Client        : http://localhost:3000  <-- browser here" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait ~10s total for all services to fully start." -ForegroundColor Gray
Write-Host ""
```

> **Note:** The script now starts 5 windows instead of 6 (monolith window removed). The remaining bookings, reviews, and payments subgraphs are **not** started by default here because `rover dev` with `supergraph-config.yaml` will compose them on-demand. If you run them as standalone servers, add their windows.

#### Task D — Update `Publish-Subgraphs.ps1`

Two changes:
1. Remove the monolith entry from `$Subgraphs`
2. Remove the `$Name -eq "monolith"` conditional block

```powershell
# BEFORE (lines 51-58):
$Subgraphs = @(
    @{ Name = "monolith"; Path = "monolith\schema.graphql"; Port = 4001 },
    @{ Name = "accounts"; Path = "subgraph-accounts\schema.graphql"; Port = 4002 },
    ...
)

# AFTER:
$Subgraphs = @(
    @{ Name = "accounts"; Path = "subgraph-accounts\schema.graphql"; Port = 4002 },
    @{ Name = "listings"; Path = "subgraph-listings\schema.graphql"; Port = 4003 },
    @{ Name = "payments"; Path = "subgraph-payments\schema.graphql"; Port = 4004 },
    @{ Name = "reviews";  Path = "subgraph-reviews\schema.graphql";  Port = 4005 },
    @{ Name = "bookings"; Path = "subgraph-bookings\schema.graphql"; Port = 4006 }
)
```

Also remove lines 70–72 (the `if ($Name -eq "monolith")` URL override block).

Per the `rover` skill: verify the script using `rover subgraph publish --help` before executing against GraphOS.

#### Exit Condition
- `supergraph-config.yaml` has zero monolith references
- `Start-Apollo.ps1` has zero monolith references
- `Publish-Subgraphs.ps1` has zero monolith references
- `scripts\launch-services.js` exists and correctly references `./services/accounts`, etc.

---

### Agent-4 — Validation Gate + GraphOS Deletion

**Skills:** `rover` + `graphql-operations` (`.agents\skills\rover\SKILL.md`, `.agents\skills\graphql-operations\SKILL.md`)  
**Duration:** ~45–60 min  
**Blocked by:** Agents 1, 2, and 3 all complete

#### Task A — Local Supergraph Composition Check

```powershell
# From repo root — compose without monolith, confirm zero errors
rover supergraph compose --config .\router\supergraph-config.yaml
```

Per the `rover` skill: specify `federation_version` explicitly and use `--format plain` for readable output.

#### Task B — Start Full Stack and Smoke Test

```powershell
# Start all services
.\Start-Apollo.ps1
```

Run the following GraphQL operations against `http://localhost:4000` (Router):

```graphql
# 1. Listings (subgraph-listings)
query FeaturedListings {
  featuredListings { id title costPerNight }
}

# 2. User profile (subgraph-accounts)
query Me {
  me { id name profilePicture }
}

# 3. Create booking (subgraph-bookings)
mutation CreateBooking {
  createBooking(createBookingInput: {
    listingId: "listing-1"
    checkInDate: "2026-06-01"
    checkOutDate: "2026-06-07"
  }) { code success message }
}

# 4. Submit review (subgraph-reviews)
mutation SubmitGuestReview {
  submitGuestReview(
    bookingId: "booking-1"
    guestReview: { text: "Great guest!", rating: 5 }
  ) { code success message }
}

# 5. Add funds (subgraph-payments)
mutation AddFunds {
  addFundsToWallet(amount: 100) { code success message amount }
}
```

Per the `graphql-operations` skill: run operations incrementally — verify each subgraph independently before cross-subgraph entity resolution tests.

#### Task C — Client Repository Check

```powershell
# In odyssey-voyage-II-client, search for any monolith port references
Select-String -Path ".\src\**\*" -Pattern "4001|monolith" -Recurse
```

Confirm `src\index.js` points only to `http://localhost:4000`.

#### Task D — GraphOS Schema Deletion (irreversible — run last)

```powershell
# Per rover skill: authenticate first
$env:APOLLO_KEY = "your-api-key"  # Never commit this — use $env: only

# Delete the monolith subgraph from GraphOS
rover subgraph delete My-Graph-9d4w0e@current --name monolith
```

> ⚠️ **This is irreversible.** Only run after all smoke tests pass and Agent-3's `Publish-Subgraphs.ps1` has been validated. Per the `rover` skill: use `rover config whoami` to confirm you are authenticated to the correct account before running delete.

#### Exit Condition (must ALL be true before Phase 3)
- `rover supergraph compose` succeeds with zero errors
- All 5 smoke-test operations return `code: 200` / `success: true`
- Client app loads at `http://localhost:3000` with no console errors referencing port 4001
- `rover subgraph delete` confirms monolith removed from GraphOS

---

## Phase 3 — Final Cleanup + Git Commit

**Blocked by:** Agent-4 sign-off  
**Duration:** ~15 min

```powershell
# Delete the monolith directory
Remove-Item -Recurse -Force .\monolith\

# Stage all changes
git add -A

# Commit
git commit -m "feat: remove monolith — all functionality migrated to federated subgraphs"

# Push to branch
git push origin federation-fixes
```

---

## Parallel Execution Timeline (Remaining Work)

```
Time →  0:00   0:30   1:00   1:30   2:00   2:30   3:00   3:30   4:00
        |------|------|------|------|------|------|------|------|------|

Agent-1 [== accounts + listings @override cleanup ==]

Agent-2 [====== bookings + reviews + payments @override cleanup =====]

Agent-3 [=== router config + scripts + PS1 cleanup ==================]

Agent-4                              [=== validate + GraphOS delete ==]

Phase-3                                                   [commit]
```

---

## Quick Reference: Windows Commands Per Agent

### Agent-1 & Agent-2 — Schema Validation

```powershell
# Lint a subgraph schema (no server needed)
rover subgraph lint --name accounts  .\subgraph-accounts\schema.graphql
rover subgraph lint --name listings  .\subgraph-listings\schema.graphql
rover subgraph lint --name bookings  .\subgraph-bookings\schema.graphql
rover subgraph lint --name reviews   .\subgraph-reviews\schema.graphql
rover subgraph lint --name payments  .\subgraph-payments\schema.graphql

# Find any remaining overrides (should return empty after cleanup)
Select-String -Path ".\subgraph-*\schema.graphql" -Pattern '@override\(from: "monolith"\)'
```

### Agent-3 — Infrastructure Verification

```powershell
# Confirm no monolith references remain in scripts/config
Select-String -Path ".\Start-Apollo.ps1",".\Publish-Subgraphs.ps1",".\router\supergraph-config.yaml" -Pattern "monolith"

# Dry-run publish script (without actually publishing)
.\Publish-Subgraphs.ps1 -Help
```

### Agent-4 — Composition + Smoke Test

```powershell
# Full composition check
rover supergraph compose --config .\router\supergraph-config.yaml

# Check client for stale monolith URLs
Select-String -Recurse -Path "F:\DEV\apollo\odyssey-voyage-II-client\src" -Pattern "4001|monolith"
```

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Removing `@override` breaks composition if monolith is still in supergraph config | Agent-3 removes it from `supergraph-config.yaml` in parallel; Agent-4's composition check catches any mismatch |
| `rover subgraph lint` fails after `@override` removal | Check that `@link` import list no longer includes `"@override"` — that import itself can cause lint warnings if no overrides exist |
| `scripts\launch-services.js` uses wrong relative paths | Agent-3 must use `path.join(__dirname, '..', 'services', ...)` to anchor paths to repo root |
| GraphOS deletion runs before smoke tests pass | Agent-4 checklist enforces smoke tests first; deletion is the final step within Agent-4 |
| `Start-Apollo.ps1` missing bookings/reviews/payments windows | Those subgraphs run via `rover dev` auto-composition; add explicit windows only if standalone mode is needed |

---

## Summary: Before vs. After

| Metric | Original Plan | This Plan |
|---|---|---|
| Steps remaining | 8 (Steps 4–11) | 4 parallel agent tracks |
| Wall-clock time remaining | 10–18 hours | **2–4 hours** |
| Phases 1–3 of original plan | Already complete ✅ | Skipped |
| Skills used | None | `apollo-federation`, `rover`, `apollo-router`, `graphql-operations` |
| Platform | Generic | Windows PowerShell + pnpm |
| Parallelism | 0% | ~75% of remaining work runs in parallel |
