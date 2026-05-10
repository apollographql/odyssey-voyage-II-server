# Plan to Remove the Monolith

To fully remove the `monolith` from this federated GraphQL architecture and rely exclusively on the subgraphs, you need to ensure that all remaining GraphQL schema definitions, resolvers, and data sources currently housed in the `monolith` are migrated to appropriate subgraphs, and then safely tear down the monolith's infrastructure.

Here is a comprehensive, step-by-step plan:

## 1. Audit the Monolith's Schema and Resolvers

- Review `monolith/schema.graphql` and `monolith/resolvers.js`.
- Compare them against the schemas of the existing subgraphs (`accounts`, `bookings`, `listings`, `payments`, `reviews`).
- Identify any queries, mutations, or types that are **only** defined or resolved in the monolith.

## 2. Migrate Remaining Functionality (Schema & Resolvers Mapping)

For any leftover functionality in the monolith, you must physically copy the type definitions and their corresponding resolver functions into the appropriate subgraphs. Here is the exact mapping of what goes where:

**To `subgraph-accounts`:**

- **Schema & Resolvers:** `Query.user`, `Query.me`, `Mutation.updateProfile`, `User` interface type resolution, and `Host`/`Guest` basic profile fields.

**To `subgraph-listings`:**

- **Schema & Resolvers:** `Query.featuredListings`, `Query.searchListings`, `Query.hostListings`, `Query.listing`, `Query.listingAmenities`, `Mutation.createListing`, `Mutation.updateListing`, the `Listing` type, `Amenity` type, and `LocationType`/`AmenityCategory` enums.

**To `subgraph-bookings`:**

- **Schema & Resolvers:** `Query.bookingsForListing`, `Query.guestBookings`, `Query.pastGuestBookings`, `Query.upcomingGuestBookings`, `Query.currentGuestBooking`, `Mutation.createBooking`, the `Booking` type, and `BookingStatus` enum.

**To `subgraph-reviews`:**

- **Schema & Resolvers:** `Mutation.submitHostAndLocationReviews`, `Mutation.submitGuestReview`, the `Review` type, and extending `Listing`/`Host`/`Booking` to return their reviews.

**To `subgraph-payments`:**

- **Schema & Resolvers:** `Mutation.addFundsToWallet`, `AddFundsToWalletResponse`, and extending the `Guest` type to resolve the `funds` field.

## 3. Migrate Data Sources and Utilities

The `monolith` contains `datasources/` and `utils/` folders that power the backend. These need to be decoupled and moved:

**Data Sources (`monolith/datasources/*`):**
Move each respective API connector to its matching subgraph so the resolvers can actually fetch data:

- Move `accounts.js` -> `subgraph-accounts/datasources/accounts.js`
- Move `listings.js` -> `subgraph-listings/datasources/listings.js`
- Move `bookings.js` -> `subgraph-bookings/datasources/bookings.js`
- Move `reviews.js` -> `subgraph-reviews/datasources/reviews.js`
- Move `payments.js` -> `subgraph-payments/datasources/payments.js`

**Utilities (`monolith/utils/*`):**

- **`errors.js`**: Copy this file into `subgraph-*/utils/errors.js` for _every_ subgraph that needs to throw an `AuthenticationError` or `ForbiddenError` (e.g. `accounts`, `listings`, `bookings`, `reviews`, `payments`).
- **Scripts (`install.js`, `launch.js`, `reset.js`, `package-manager.js`)**: These are top-level tools used to manage the mock database services in `services/`. Move them to a new `scripts/` directory at the absolute root of the repository (e.g., `f:\DEV\apollo\odyssey-voyage-II-server\scripts\`).

## 4. Remove `@override` Directives from Subgraphs

Since the `monolith` will no longer be part of the supergraph composition, all `@override(from: "monolith")` directives in the subgraphs must be safely removed. Leaving them in place will cause Federation composition errors or warnings because the target subgraph (`monolith`) will no longer exist.

**Files to update:**

- `subgraph-accounts/schema.graphql`
- `subgraph-bookings/schema.graphql`
- `subgraph-listings/schema.graphql`
- `subgraph-payments/schema.graphql`
- `subgraph-reviews/schema.graphql`

**Action:**
Delete all instances of `@override(from: "monolith")` from every type, query, and mutation in these schemas.

## 5. Unlink the Monolith from the Apollo Router

The Apollo Router needs to be instructed to stop looking for the `monolith` subgraph during local development.

**File to update:**

- `router/supergraph-config.yaml`

**Action:**
Remove the `monolith` block entirely:

```yaml
# DELETE THIS ENTIRE BLOCK
monolith:
  routing_url: http://localhost:4001
  schema:
    file: ..\monolith\schema.graphql
```

## 6. Repoint REST Backing Services

Currently, the REST APIs (mock databases for Accounts, Listings, Bookings) are being started via `pnpm launch` _inside_ the `monolith/package.json` and `monolith/utils/launch.js`. Since we moved these utility scripts to the root in Step 3, we must update how they are run.

**Action:**

- Update the `cwd` paths inside the new `scripts/launch-services.js` file to correctly point to `./services/accounts`, `./services/listings`, and `./services/bookings` relative to the root folder.
- Add a script in the root `package.json` (or create one) to run `node scripts/launch-services.js` with `concurrently`.

## 7. Clean up Local Start Scripts

The root PowerShell script responsible for starting all microservices references the monolith directory to start both the REST APIs and the Monolith subgraph.

**File to update:**

- `Start-Apollo.ps1`

**Action:**

- **Step 1:** Change the working directory for "REST Services (pnpm launch)" from `$RootServer\monolith` to `$RootServer` and update the command to `node scripts/launch-services.js` (or whatever script you made in Step 6).
- **Step 2:** Delete the section entirely that starts the `monolith` subgraph (Port 4001).
- **Step 7:** Remove the `monolith` URL entry from the terminal's printed success list.

## 8. Clean up CI/CD & Publishing Scripts

The script used to publish your subgraphs to GraphOS via `rover` still expects to publish the monolith.

**File to update:**

- `Publish-Subgraphs.ps1`

**Action:**

- Remove the `monolith` entry from the `$Subgraphs` array definition.

```powershell
# DELETE THIS LINE:
@{ Name = "monolith"; Path = "monolith\schema.graphql"; Port = 4001 },
```

- Remove the specific `$Name -eq "monolith"` staging URL fallback logic further down in the script.

## 9. GraphOS Schema Deletion (Cloud)

To finalize the removal from Apollo Studio / GraphOS, you must delete the subgraph using Rover.

**Action:**
Run the following command from your terminal:

```bash
rover subgraph delete My-Graph-9d4w0e@current --name monolith
```

_(Replace `My-Graph-9d4w0e@current` with your actual graph ref and variant)_

## 10. Client Repository Checks

The client (`odyssey-voyage-II-client`) operates entirely by querying the Apollo Router (running on `http://localhost:4000`). Because the router abstracts the underlying subgraphs, **no changes are strictly required in the client code**.

**Verification:**

- `src/index.js` points to `http://localhost:4000`. This remains completely valid.
- There are no hardcoded GraphQL requests to `http://localhost:4001` (the monolith) inside the client.
- Ensure that you haven't manually hardcoded the monolith URL into your `.env` variables (`REACT_APP_GQL_SERVER`).

## 11. Delete the Monolith

Once all scripts are updated and the supergraph perfectly composes without errors, you can safely wipe the directory.

**Action:**

- Delete the `monolith` folder entirely.
- Commit all changes to the `federation-fixes` branch.

## Implementation Plan with Time Estimates

Based on the steps outlined above, here's a detailed implementation plan with estimated timeframes. These estimates assume a single experienced developer familiar with GraphQL, Apollo Federation, and the codebase. Times include research, coding, testing, and validation. Actual times may vary based on unforeseen issues or learning curve.

### Step 1: Audit the Monolith's Schema and Resolvers

- **Details:** Carefully review `monolith/schema.graphql` and `monolith/resolvers.js`. Cross-reference with existing subgraph schemas. Document all unique queries, mutations, types, and resolvers in the monolith that aren't duplicated elsewhere. Use tools like grep to search for dependencies.
- **Time Estimate:** 2-4 hours
- **Risks:** Missing subtle dependencies could cause issues later.

### Step 2: Migrate Remaining Functionality (Schema & Resolvers Mapping)

- **Details:** For each subgraph (accounts, listings, bookings, reviews, payments), copy the relevant schema definitions from `monolith/schema.graphql` into the subgraph's schema.graphql. Then, copy and adapt resolver functions from `monolith/resolvers.js` to the subgraph's resolvers.js. Ensure imports and data sources are updated. Test each migration incrementally.
- **Time Estimate:** 8-12 hours (2-3 hours per subgraph, plus integration testing)
- **Risks:** Resolver logic may need refactoring for subgraph-specific contexts.

### Step 3: Migrate Data Sources and Utilities

- **Details:** Move data source files from `monolith/datasources/` to respective subgraphs. Copy `errors.js` to all subgraphs needing it. Move utility scripts to root `scripts/` directory. Update any relative paths in the moved files. Test data fetching in each subgraph.
- **Time Estimate:** 4-6 hours
- **Risks:** Path changes could break imports; verify all references.

### Step 4: Remove @override Directives from Subgraphs

- **Details:** In each subgraph's schema.graphql, search for and remove all `@override(from: "monolith")` directives. Use grep to find them quickly. After removal, run schema validation to ensure no composition errors.
- **Time Estimate:** 1-2 hours
- **Risks:** Removing overrides might expose conflicts if not all functionality was migrated.

### Step 5: Unlink the Monolith from the Apollo Router

- **Details:** Edit `router/supergraph-config.yaml` to remove the monolith block. Restart the router and verify the supergraph composes without the monolith.
- **Time Estimate:** 30 minutes - 1 hour
- **Risks:** Router may fail to start if other configs reference the monolith.

### Step 6: Repoint REST Backing Services

- **Details:** Update paths in the moved launch scripts to point to `./services/` from the root. Add or update root package.json scripts to run the services. Test that REST APIs start correctly from the new location.
- **Time Estimate:** 2-3 hours
- **Risks:** Service startup failures if paths are incorrect.

### Step 7: Clean up Local Start Scripts

- **Details:** Modify `Start-Apollo.ps1` to change the REST services command and remove monolith subgraph startup. Update printed URLs. Test the full startup sequence.
- **Time Estimate:** 1-2 hours
- **Risks:** Script errors could prevent services from starting.

### Step 8: Clean up CI/CD & Publishing Scripts

- **Details:** Remove monolith from `Publish-Subgraphs.ps1`. Test subgraph publishing to ensure it works without the monolith.
- **Time Estimate:** 30 minutes - 1 hour
- **Risks:** Publishing failures if other scripts depend on monolith.

### Step 9: GraphOS Schema Deletion (Cloud)

- **Details:** Run the rover command to delete the monolith subgraph from GraphOS.
- **Time Estimate:** 15-30 minutes
- **Risks:** Accidental deletion of wrong subgraph.

### Step 10: Client Repository Checks

- **Details:** Verify client configuration points to router and no hardcoded monolith URLs.
- **Time Estimate:** 30 minutes
- **Risks:** Client may break if misconfigured.

### Step 11: Delete the Monolith

- **Details:** Delete the monolith folder and commit changes.
- **Time Estimate:** 15 minutes
- **Risks:** Ensure all dependencies are removed.

### Overall Timeline and Recommendations

- **Total Estimated Time:** 20-32 hours (spread over 3-5 working days to allow for testing and fixes)
- **Testing Strategy:** After each major step (e.g., after migrations), run the full service stack and execute key queries/mutations to verify functionality. Use Apollo Studio or Rover to validate supergraph composition.
- **Backup Plan:** Commit changes incrementally. If issues arise, rollback to previous commits.
- **Prerequisites:** Ensure all subgraphs are running and testable before starting. Have a development environment ready for validation.
- **Post-Implementation:** Update documentation/READMEs to reflect the new architecture.
