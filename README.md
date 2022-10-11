# Odyssey Voyage II - Server (Airlock)

Welcome to the companion app of Odyssey's Voyage II: Federating the Monolith! This is the `server` backend of the Airlock app. You can [find the course lessons and instructions on Odyssey](http://apollographql.com/tutorials/voyage-part2), Apollo's learning platform.

You can [preview the completed demo app here](https://odyssey-airlock.netlify.app/).

You can [find the client counterpart here](https://github.com/apollographql/odyssey-voyage-II-client).

## How to use this repo

The course will walk you through step by step how to turn this monolithic graph into a federated graph. This codebase is the starting point of your journey!

To get started:

In a terminal window, navigate to the `monolith` directory.

1. Run `npm install`.
1. Run `npm start`.

This will start the GraphQL API server on [http://localhost:4000](http://localhost:4000)

Next, let's run some local services.

1. In a new terminal window, still in the `monolith` directory, run `npm run launch`. This will run 4 local services, which you can learn about in the [accompanying Odyssey course](https://www.apollographql.com/tutorials/voyage-part2/monolith-graph-setup).

### Resetting the database

After playing around with the data, you may want to reset to its initial state. To do this, run `npm run db:reset`.

## How to run the `final` version of the code

You can take a peek at what the final version of the code should look like (after completing all the steps in the course).

To run the `final` version, navigate to the `final/router` directory.

In a new terminal window, run `APOLLO_KEY=<APOLLO_KEY> APOLLO_GRAPH_REF=<APOLLO_GRAPH_REF> ./router --config config.yaml`. 

Make sure to replace the values for `APOLLO_KEY` and `APOLLO_GRAPH_REF` (see course content for more details on how to set these up).

This will start the router on [http://localhost:4000](http://localhost:4000)

Next, let's run the subgraphs we split off according to the course instructions: the monolith subgraph (what's left of it) and the `accounts` subgraph.

1. In a new terminal window, navigate to the root of the `final/monolith` directory, run `npm start`.
1. In a new terminal window, navigate to the `final/subgraph-accounts` directory, run `npm install` then `npm start`.

Finally, let's run some local services.

1. In a new terminal window, navigate to the `final/monolith` directory, then run `npm run launch`. This will run 4 local services, which you can learn about in the accompanying Odyssey course.

## Getting Help

For any issues or problems concerning the course content, please [refer to the Odyssey topic in our community forums](https://community.apollographql.com/tags/c/help/6/odyssey).
