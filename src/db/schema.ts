import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: uuid().primaryKey(),
	telegramId: bigint({ mode: "number" }).unique().notNull(),
});

export const subscription = pgTable("subscription", {
	id: uuid().primaryKey(),
	userId: uuid()
		.notNull()
		.references(() => user.id),
	enabled: boolean().default(true).notNull(),
	filter: text().notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true })
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
});

export const processHistory = pgTable("process_history", {
	id: uuid().primaryKey(),
	subscriptionId: uuid()
		.notNull()
		.references(() => subscription.id),
	infoHash: text().notNull(),
	proccessedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionRelations = relations(
	subscription,
	({ one, many }) => ({
		user: one(user, {
			fields: [subscription.userId],
			references: [user.id],
		}),
		subscription: many(subscription),
	}),
);

export const processHistoryRelations = relations(
	processHistory,
	({ one, many }) => ({
		subscription: one(subscription, {
			fields: [processHistory.subscriptionId],
			references: [subscription.id],
		}),
		processHistory: many(processHistory),
	}),
);
