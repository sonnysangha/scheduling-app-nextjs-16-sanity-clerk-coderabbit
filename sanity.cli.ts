/**
 * This configuration file lets you run `$ sanity [command]` in this folder
 * Go to https://www.sanity.io/docs/cli to learn more.
 **/
import { defineCliConfig } from "sanity/cli";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: "calendly-clone",
  typegen: {
    // Glob pattern to find all TypeScript/JavaScript files with GROQ queries
    path: "./**/*.{ts,tsx,js,jsx}",
    // Path to the extracted schema file
    schema: "./schema.json",
    // Output path for generated types
    generates: "./sanity/types.ts",
    // Enable automatic type inference when using client.fetch()
    overloadClientMethods: true,
  },
});
