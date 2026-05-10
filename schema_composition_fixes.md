# Schema Composition Fixes

## Issue Identified

When running `rover supergraph compose --config .\router\supergraph-config.yaml`, the following hints/warnings were output:

```
HINT: [INCONSISTENT_INTERFACE_VALUE_TYPE_FIELD]: Field "User.name" of interface type "User" is defined in some but not all subgraphs that define "User": "User.name" is defined in subgraph "accounts" but not in subgraph "reviews".
HINT: [INCONSISTENT_INTERFACE_VALUE_TYPE_FIELD]: Field "User.profilePicture" of interface type "User" is defined in some but not all subgraphs that define "User": "User.profilePicture" is defined in subgraph "accounts" but not in subgraph "reviews".
```

## Why This Happened

In Apollo Federation 2, when an `interface` (like `User`) is defined across multiple subgraphs (in our case, `accounts` and `reviews`), it must be defined consistently. 

The `accounts` subgraph is the primary owner of `User` and defines it as:
```graphql
interface User {
  id: ID!
  name: String!
  profilePicture: String!
}
```

However, the `reviews` subgraph only defined it as:
```graphql
interface User {
  id: ID!
}
```

Since `Review.author` returns a `User`, the `reviews` subgraph needed a local definition of the `User` interface. But by omitting the `name` and `profilePicture` fields, it created an inconsistent definition across the supergraph.

## How It Was Fixed

To resolve this, we updated `subgraph-reviews\schema.graphql` to match the `User` interface definition from `accounts`, and added those fields as `@external` to the types (`Host` and `Guest`) that implement `User` in the `reviews` subgraph.

1. **Imported `@external`**: Added `@external` to the `@link` directive at the top of the file.
2. **Updated `interface User`**: Added `name: String!` and `profilePicture: String!` to the interface.
3. **Updated Implementations**: Added `name: String! @external` and `profilePicture: String! @external` to both `type Host` and `type Guest`. 

By marking these fields as `@external`, we tell Apollo Router that the `reviews` subgraph acknowledges these fields exist to satisfy the interface, but the `reviews` subgraph is not responsible for resolving their data (the `accounts` subgraph will handle that).

## Final Supergraph Schema

After applying the fixes, the composition succeeds cleanly, producing the following Supergraph Schema:

`graphql

schema
  @link(url: "https://specs.apollo.dev/link/v1.0")
  @link(url: "https://specs.apollo.dev/join/v0.4", for: EXECUTION)
{
  query: Query
  mutation: Mutation
}

directive @join__directive(graphs: [join__Graph!], name: String!, args: join__DirectiveArguments) repeatable on SCHEMA | OBJECT | INTERFACE | FIELD_DEFINITION

directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

directive @join__field(graph: join__Graph, requires: join__FieldSet, provides: join__FieldSet, type: String, external: Boolean, override: String, usedOverridden: Boolean, overrideLabel: String) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

directive @join__graph(name: String!, url: String!) on ENUM_VALUE

directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

directive @join__type(graph: join__Graph!, key: join__FieldSet, extension: Boolean! = false, resolvable: Boolean! = true, isInterfaceObject: Boolean! = false) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

type AddFundsToWalletResponse implements MutationResponse
  @join__implements(graph: PAYMENTS, interface: "MutationResponse")
  @join__type(graph: PAYMENTS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!

  """Updated wallet amount"""
  amount: Float
}

"""
What the location provides. An amenity should be tied to a specific category.
"""
type Amenity
  @join__type(graph: LISTINGS)
{
  id: ID!

  """The category for the amenity"""
  category: AmenityCategory!

  """The name of the amenity. Should be short."""
  name: String!
}

"""The category an amenity belongs to."""
enum AmenityCategory
  @join__type(graph: LISTINGS)
{
  ACCOMMODATION_DETAILS @join__enumValue(graph: LISTINGS)
  SPACE_SURVIVAL @join__enumValue(graph: LISTINGS)
  OUTDOORS @join__enumValue(graph: LISTINGS)
}

"""A booking is a reservation for a specific listing"""
type Booking
  @join__type(graph: BOOKINGS, key: "id")
{
  id: ID!

  """The listing associated with the reservation"""
  listing: Listing!

  """The guest that reserved the location"""
  guest: Guest!

  """Check-in date for the reservation"""
  checkInDate: String!

  """Check-out date for the reservation"""
  checkOutDate: String!

  """
  Total price paid, calculated using the listing's costPerNight and the check-in check-out dates
  """
  totalPrice: Float!

  """
  The status of the booking - check BookingStatus type for all possibilities
  """
  status: BookingStatus!

  """The guest's review of the location"""
  locationReview: Review

  """The guest's review about the host"""
  hostReview: Review

  """The host's review about the guest"""
  guestReview: Review
}

"""The status of a booking"""
enum BookingStatus
  @join__type(graph: BOOKINGS)
{
  CURRENT @join__enumValue(graph: BOOKINGS)
  COMPLETED @join__enumValue(graph: BOOKINGS)
  UPCOMING @join__enumValue(graph: BOOKINGS)
}

"""Fields for creating a booking"""
input CreateBookingInput
  @join__type(graph: BOOKINGS)
{
  """ID of the listing associated with the booking"""
  listingId: ID!

  """Date of check-in"""
  checkInDate: ID!

  """Date of check-out"""
  checkOutDate: ID!
}

"""The response after creating a booking."""
type CreateBookingResponse implements MutationResponse
  @join__implements(graph: BOOKINGS, interface: "MutationResponse")
  @join__type(graph: BOOKINGS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!

  """The newly-created booking"""
  booking: NewBookingResponse
}

"""Input for creating a new listing"""
input CreateListingInput
  @join__type(graph: LISTINGS)
{
  """The listing's title"""
  title: String!

  """The listing's description"""
  description: String!

  """The listing's main image URL"""
  photoThumbnail: String!

  """The number of beds available"""
  numOfBeds: Int!

  """The cost per night"""
  costPerNight: Float!

  """The location type of the listing"""
  locationType: LocationType!

  """The listing's amenities"""
  amenities: [ID!]!
}

"""The response after creating a listing"""
type CreateListingResponse implements MutationResponse
  @join__implements(graph: LISTINGS, interface: "MutationResponse")
  @join__type(graph: LISTINGS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!

  """The newly created listing"""
  listing: Listing!
}

"""A guest is a type of Airlock user. They book places to stay."""
type Guest implements User
  @join__implements(graph: ACCOUNTS, interface: "User")
  @join__implements(graph: REVIEWS, interface: "User")
  @join__type(graph: ACCOUNTS, key: "id")
  @join__type(graph: BOOKINGS, key: "id")
  @join__type(graph: PAYMENTS, key: "id")
  @join__type(graph: REVIEWS, key: "id")
{
  """The unique identifier of the guest"""
  id: ID!

  """The user's first and last name"""
  name: String! @join__field(graph: ACCOUNTS) @join__field(graph: REVIEWS, external: true)

  """The user's profile photo URL"""
  profilePicture: String! @join__field(graph: ACCOUNTS) @join__field(graph: REVIEWS, external: true)

  """Amount of money in the guest's wallet"""
  funds: Float! @join__field(graph: PAYMENTS)
}

"""A host is a type of Airlock user. They own listings."""
type Host implements User
  @join__implements(graph: ACCOUNTS, interface: "User")
  @join__implements(graph: REVIEWS, interface: "User")
  @join__type(graph: ACCOUNTS, key: "id")
  @join__type(graph: LISTINGS, key: "id", resolvable: false)
  @join__type(graph: REVIEWS, key: "id")
{
  id: ID!

  """The user's first and last name"""
  name: String! @join__field(graph: ACCOUNTS) @join__field(graph: REVIEWS, external: true)

  """The user's profile photo URL"""
  profilePicture: String! @join__field(graph: ACCOUNTS) @join__field(graph: REVIEWS, external: true)

  """The host's profile bio description, will be shown in the listing"""
  profileDescription: String! @join__field(graph: ACCOUNTS)

  """The overall calculated rating for the host"""
  overallRating: Float @join__field(graph: REVIEWS)
}

scalar join__DirectiveArguments

scalar join__FieldSet

enum join__Graph {
  ACCOUNTS @join__graph(name: "accounts", url: "http://localhost:4002")
  BOOKINGS @join__graph(name: "bookings", url: "http://localhost:4006")
  LISTINGS @join__graph(name: "listings", url: "http://localhost:4003")
  PAYMENTS @join__graph(name: "payments", url: "http://localhost:4004")
  REVIEWS @join__graph(name: "reviews", url: "http://localhost:4005")
}

scalar link__Import

enum link__Purpose {
  """
  `SECURITY` features provide metadata necessary to securely resolve fields.
  """
  SECURITY

  """
  `EXECUTION` features provide metadata necessary for operation execution.
  """
  EXECUTION
}

"""
A listing is a location owned by a host. A listing has a list of amenities it offers. Listings have a fixed cost per night value.
"""
type Listing
  @join__type(graph: BOOKINGS, key: "id")
  @join__type(graph: LISTINGS, key: "id")
  @join__type(graph: REVIEWS, key: "id")
{
  id: ID!

  """The listing's title"""
  title: String! @join__field(graph: LISTINGS)

  """The listing's description"""
  description: String! @join__field(graph: LISTINGS)

  """The thumbnail image for the listing"""
  photoThumbnail: String! @join__field(graph: LISTINGS)

  """The number of beds available"""
  numOfBeds: Int! @join__field(graph: LISTINGS)

  """The cost per night"""
  costPerNight: Float! @join__field(graph: LISTINGS)

  """The location type of the listing"""
  locationType: LocationType! @join__field(graph: LISTINGS)

  """Owner of the listing"""
  host: Host! @join__field(graph: LISTINGS)

  """The amenities available for this listing"""
  amenities: [Amenity]! @join__field(graph: LISTINGS)

  """Calculated total cost of the listing with the given arguments"""
  totalCost(checkInDate: String!, checkOutDate: String!): Float! @join__field(graph: LISTINGS)

  """The submitted reviews for this listing"""
  reviews: [Review]! @join__field(graph: REVIEWS)

  """The overall calculated rating for a listing"""
  overallRating: Float @join__field(graph: REVIEWS)
}

"""A listing can be one of these types."""
enum LocationType
  @join__type(graph: LISTINGS)
{
  SPACESHIP @join__enumValue(graph: LISTINGS)
  HOUSE @join__enumValue(graph: LISTINGS)
  CAMPSITE @join__enumValue(graph: LISTINGS)
  APARTMENT @join__enumValue(graph: LISTINGS)
  ROOM @join__enumValue(graph: LISTINGS)
}

"""The root mutation type"""
type Mutation
  @join__type(graph: ACCOUNTS)
  @join__type(graph: BOOKINGS)
  @join__type(graph: LISTINGS)
  @join__type(graph: PAYMENTS)
  @join__type(graph: REVIEWS)
{
  """Updates the logged-in user's profile information"""
  updateProfile(updateProfileInput: UpdateProfileInput): UpdateProfileResponse! @join__field(graph: ACCOUNTS)
  createBooking(createBookingInput: CreateBookingInput): CreateBookingResponse! @join__field(graph: BOOKINGS)

  """Creates a new listing for the currently authenticated host"""
  createListing(listing: CreateListingInput!): CreateListingResponse! @join__field(graph: LISTINGS)

  """Updates an existing listing"""
  updateListing(listingId: ID!, listing: UpdateListingInput!): UpdateListingResponse! @join__field(graph: LISTINGS)

  """Add funds to a guest's wallet"""
  addFundsToWallet(amount: Float!): AddFundsToWalletResponse @join__field(graph: PAYMENTS)

  """
  Creates reviews for both host and listing for a particular booking - must be authored by guest of past booking
  """
  submitHostAndLocationReviews(bookingId: ID!, hostReview: ReviewInput!, locationReview: ReviewInput!): SubmitHostAndLocationReviewsResponse! @join__field(graph: REVIEWS)

  """
  Creates a review for the guest - must be authored by host of past booking
  """
  submitGuestReview(bookingId: ID!, guestReview: ReviewInput!): SubmitGuestReviewResponse! @join__field(graph: REVIEWS)
}

"""A standard mutation response interface"""
interface MutationResponse
  @join__type(graph: ACCOUNTS)
  @join__type(graph: BOOKINGS)
  @join__type(graph: LISTINGS)
  @join__type(graph: PAYMENTS)
  @join__type(graph: REVIEWS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!
}

"""Minimum details needed for a newly created booking"""
type NewBookingResponse
  @join__type(graph: BOOKINGS)
{
  id: ID!
  checkInDate: String!
  checkOutDate: String!
}

"""The root query type"""
type Query
  @join__type(graph: ACCOUNTS)
  @join__type(graph: BOOKINGS)
  @join__type(graph: LISTINGS)
  @join__type(graph: PAYMENTS)
  @join__type(graph: REVIEWS)
{
  user(id: ID!): User @join__field(graph: ACCOUNTS)

  """Currently logged-in user"""
  me: User! @join__field(graph: ACCOUNTS)

  """
  All bookings for the given listing, optionally filtered by a BookingStatus
  """
  bookingsForListing(listingId: ID!, status: BookingStatus): [Booking]! @join__field(graph: BOOKINGS)

  """A list of bookings for the guest - must be authenticated as guest"""
  guestBookings: [Booking]! @join__field(graph: BOOKINGS)

  """Past bookings for guest based on current date"""
  pastGuestBookings: [Booking]! @join__field(graph: BOOKINGS)

  """Upcoming and current bookings for guest based on current date"""
  upcomingGuestBookings: [Booking]! @join__field(graph: BOOKINGS)

  """Current booking for guest based on current date"""
  currentGuestBooking: Booking @join__field(graph: BOOKINGS)

  """A curated array of listings to feature on the homepage"""
  featuredListings: [Listing!]! @join__field(graph: LISTINGS)

  """Search results for listings that fit the criteria provided"""
  searchListings(criteria: SearchListingsInput): [Listing]! @join__field(graph: LISTINGS)

  """Return the listings that belong to the currently logged-in host"""
  hostListings: [Listing]! @join__field(graph: LISTINGS)

  """Returns the details about this listing"""
  listing(id: ID!): Listing @join__field(graph: LISTINGS)

  """Returns all possible amenities for a listing"""
  listingAmenities: [Amenity!]! @join__field(graph: LISTINGS)

  """Get a guest by ID"""
  guest(id: ID!): Guest @join__field(graph: PAYMENTS)
}

"""
A review consists of a numerical rating and written text. It can be written by a host or a guest.
"""
type Review
  @join__type(graph: BOOKINGS, key: "id")
  @join__type(graph: REVIEWS, key: "id")
{
  id: ID!

  """Written comment the author has written about the review target"""
  text: String! @join__field(graph: REVIEWS)

  """User that wrote the review"""
  author: User! @join__field(graph: REVIEWS)

  """
  The numerical rating for the review target, on a scale of 1-5, with 5 being excellent.
  """
  rating: Float! @join__field(graph: REVIEWS)
}

"""
ReviewInput is the bare minimum needed to submit a review, not tied to any target.
"""
input ReviewInput
  @join__type(graph: REVIEWS)
{
  text: String!
  rating: Float!
}

"""To search for a listing, you need these fields."""
input SearchListingsInput
  @join__type(graph: LISTINGS)
{
  checkInDate: String!
  checkOutDate: String!
  numOfBeds: Int

  """The page in the search results, defaults to 1"""
  page: Int

  """The number of listings you can display in a page, defaults to 5"""
  limit: Int

  """The results sort order, defaults to cost descending"""
  sortBy: SortByCriteria
}

"""The available sorting criteria for listings"""
enum SortByCriteria
  @join__type(graph: LISTINGS)
{
  COST_ASC @join__enumValue(graph: LISTINGS)
  COST_DESC @join__enumValue(graph: LISTINGS)
  RATING_ASC @join__enumValue(graph: LISTINGS)
  RATING_DESC @join__enumValue(graph: LISTINGS)
  BEDS_ASC @join__enumValue(graph: LISTINGS)
  BEDS_DESC @join__enumValue(graph: LISTINGS)
  DISTANCE @join__enumValue(graph: LISTINGS)
}

"""The response after submitting reviews for a guest."""
type SubmitGuestReviewResponse implements MutationResponse
  @join__implements(graph: REVIEWS, interface: "MutationResponse")
  @join__type(graph: REVIEWS)
{
  code: Int!
  success: Boolean!
  message: String!
  guestReview: Review
}

"""
The response after submitting reviews for both host and location together.
"""
type SubmitHostAndLocationReviewsResponse implements MutationResponse
  @join__implements(graph: REVIEWS, interface: "MutationResponse")
  @join__type(graph: REVIEWS)
{
  code: Int!
  success: Boolean!
  message: String!
  hostReview: Review
  locationReview: Review
}

"""Fields that can be updated"""
input UpdateListingInput
  @join__type(graph: LISTINGS)
{
  """The listing's title"""
  title: String

  """The listing's description"""
  description: String

  """The listing's main image URL"""
  photoThumbnail: String

  """The number of beds available"""
  numOfBeds: Int

  """The cost per night"""
  costPerNight: Float

  """The location type of the listing"""
  locationType: LocationType

  """The Listing's amenities """
  amenities: [ID]
}

"""The response after updating a listing"""
type UpdateListingResponse implements MutationResponse
  @join__implements(graph: LISTINGS, interface: "MutationResponse")
  @join__type(graph: LISTINGS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!

  """Updated listing"""
  listing: Listing
}

"""Fields that can be updated"""
input UpdateProfileInput
  @join__type(graph: ACCOUNTS)
{
  """The user's first and last name"""
  name: String

  """The user's profile photo URL"""
  profilePicture: String

  """The host's profile bio description, will be shown in the listing"""
  profileDescription: String
}

"""The response after updating a profile"""
type UpdateProfileResponse implements MutationResponse
  @join__implements(graph: ACCOUNTS, interface: "MutationResponse")
  @join__type(graph: ACCOUNTS)
{
  """Similar to HTTP status code, represents the status of the mutation"""
  code: Int!

  """Indicates whether the mutation was successful"""
  success: Boolean!

  """Human-readable message for the UI"""
  message: String!

  """Updated user"""
  user: User
}

"""Represents an Airlock user's common properties"""
interface User
  @join__type(graph: ACCOUNTS)
  @join__type(graph: REVIEWS)
{
  id: ID!

  """The user's first and last name"""
  name: String!

  """The user's profile photo URL"""
  profilePicture: String!
}

`
