import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export const db = drizzle({
  connection: process.env["DATABASE_URL"]!,
  casing: "snake_case",
  schema,
});

export default db;

export {
  user,
  subscription,
  processHistory,
  subscriptionRelations,
  processHistoryRelations,
} from "./schema.js";
