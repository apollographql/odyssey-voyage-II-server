# Odyssey Voyage II - Server (Airlock)

Welcome to the companion app of Odyssey's Voyage II: Federating the Monolith! This is the `server` backend of the Airlock app. You can [find the course lessons and instructions on Odyssey](http://apollographql.com/tutorials/voyage-part2), Apollo's learning platform.

You can [preview the completed demo app here](https://odyssey-airlock.netlify.app/).

You can [find the client counterpart here](https://github.com/apollographql/odyssey-voyage-II-client).

## How to use this repo

The course will walk you through step by step how to turn this monolithic graph into a federated graph. This codebase is the starting point of your journey!

To get started, navigate to the `monolith` directory in a terminal window.

**Using pnpm (recommended):**

```sh
pnpm install
pnpm start
```

**Using npm:**

```sh
npm install
npm start
```

This will start the GraphQL API server on [http://localhost:4000](http://localhost:4000).

Next, let's run some local services.

In a new terminal window, still in the `monolith` directory, run:

```sh
pnpm run launch   # or: npm run launch
```

This will run 4 local services, which you can learn about in the [accompanying Odyssey course](https://www.apollographql.com/tutorials/voyage-part2/monolith-graph-setup).

### Resetting the database

After playing around with the data, you may want to reset to its initial state:

```sh
pnpm run db:reset   # or: npm run db:reset
```

## How to run the `final` version of the code

You can take a peek at what the final version of the code should look like (after completing all the steps in the course).

To run the `final` version, navigate to the `final/router` directory.

In a new terminal window, run `APOLLO_KEY=<APOLLO_KEY> APOLLO_GRAPH_REF=<APOLLO_GRAPH_REF> ./router --config config.yaml`.

Make sure to replace the values for `APOLLO_KEY` and `APOLLO_GRAPH_REF` (see course content for more details on how to set these up).

This will start the router on [http://localhost:4000](http://localhost:4000).

Next, let's run the subgraphs: the monolith subgraph and the `accounts` subgraph.

1. In a new terminal, navigate to `final/monolith` and run `pnpm start` (or `npm start`).
1. In a new terminal, navigate to `final/subgraph-accounts` and run `pnpm install && pnpm start` (or `npm install && npm start`).

Finally, in a new terminal in `final/monolith`, run:

```sh
pnpm run launch   # or: npm run launch
```

> **Note:** Each sub-package includes an `.npmrc` with `shamefully-hoist=true` so that nodemon and other tools resolve correctly under pnpm's non-flat `node_modules` layout.

## Getting Help

For any issues or problems concerning the course content, please [refer to the Odyssey topic in our community forums](https://community.apollographql.com/tags/c/help/6/odyssey).
