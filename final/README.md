# FINAL CODE - Odyssey Voyage II - Server (Airlock)

This is the final state of the codebase after going through the Odyssey Voyage II course.

You can [find the course lessons and instructions on Odyssey](http://odyssey.apollographql.com/voyage-part2), Apollo's learning platform.

You can [preview the completed demo app here](https://odyssey-airlock.netlify.app/).

You can [find the client counterpart here](https://github.com/apollographql/odyssey-voyage-II-client).

## How to use this repo for the final version of the course project

The course will walk you through step by step how to turn this monolithic graph into a federated graph. This codebase is the final point of your journey!

To get started:

1. Run `npm install` in the `final` directory.
1. Run `npm start` in the `final` directory.

This will start the GraphQL API gateway on [http://localhost:4000](http://localhost:4000)

Next, let's run the subgraphs we split off according to the course instructions: the monolith subgraph (what's left of it), the accounts subgraph and the listings subgraph.

1. In a new terminal window, navigate to the root of the `final` directory, run `npm run start:monolith-subgraph`.
1. In a new terminal window, navigate to the `final/subgraph-accounts` directory, run `npm install` then `npm start`.
1. In a new terminal window, navigate to the `final/subgraph-listings` directory, run `npm install` then `npm start`.

Finally, let's run some local services.

1. In a new terminal window, navigate to the `final` directory, then run `npm run launch`. This will run 4 local services, which you can learn about in the accompanying Odyssey course.

### Resetting the database

After playing around with the data, you may want to reset to its initial state. To do this, run `npm run db:reset` in the root of the `final` directory.

## Getting Help

For any issues or problems concerning the course content, please [refer to the Odyssey topic in our community forums](https://community.apollographql.com/tags/c/help/6/odyssey).