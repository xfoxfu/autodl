ALTER TABLE "user" ADD COLUMN "alist_endpoint" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alist_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "alist_password" text;--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "source_type";