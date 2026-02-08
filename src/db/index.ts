import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export const db = drizzle({
	// biome-ignore lint/style/noNonNullAssertion: env var
	// biome-ignore lint/complexity/useLiteralKeys: env var
	connection: process.env["DATABASE_URL"]!,
	casing: "snake_case",
	schema,
});

export default db;

export {
	processHistory,
	processHistoryRelations,
	subscription,
	subscriptionRelations,
	user,
} from "./schema.js";
