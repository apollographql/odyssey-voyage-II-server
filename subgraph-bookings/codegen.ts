import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // Path to your GraphQL schema file
  schema: "./schema.graphql", 
  generates: {
    // The path where the generated types will live
    "./types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
    },
  },
};

export default config;