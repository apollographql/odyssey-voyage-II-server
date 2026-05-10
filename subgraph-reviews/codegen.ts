import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // Path to your GraphQL schema file
  schema: "./src/schema.graphql", 
  generates: {
    // The path where the generated types will live
    "./src/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
    },
  },
};

export default config;