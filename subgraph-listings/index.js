// @ts-nocheck
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { buildSubgraphSchema } = require("@apollo/subgraph");

const { readFileSync } = require("fs");
const axios = require("axios");
const { default: gql } = require("graphql-tag");

const { AuthenticationError } = require("./utils/errors");

const typeDefs = gql(readFileSync("./schema.graphql", { encoding: "utf-8" }));
const resolvers = require("./resolvers");
const ListingsAPI = require("./datasources/listings");
const ReviewsAPI = require("../subgraph-reviews/datasources/reviews");
const BookingsAPI = require("../subgraph-bookings/datasources/bookings");

async function startApolloServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({
      typeDefs,
      resolvers,
    }),
  });

  const port = 4003;
  const subgraphName = "listings";

  try {
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization || "";
        const userId = token.split(" ")[1]; // get the user name after 'Bearer '

        let userInfo = {};
        if (userId) {
          const { data } = await axios
            .get(`http://127.0.0.1:4010/login/${userId}`)
            .catch((error) => {
              throw AuthenticationError();
            });

          userInfo = { userId: data.id, userRole: data.role };
        }

        const { cache } = server;

        const dataSources = {
          listingsAPI: new ListingsAPI({ cache }),
        };

        Object.defineProperties(dataSources, {
          reviewsDb: {
            get: () => new ReviewsAPI(),
          },
          bookingsDb: {
            get: () => new BookingsAPI(),
          },
        });

        return {
          ...userInfo,
          dataSources,
        };
      },
      listen: {
        port,
      },
    });

    console.log(`🚀 Subgraph ${subgraphName} running at ${url}`);
  } catch (err) {
    console.error(err);
  }
}

startApolloServer();
