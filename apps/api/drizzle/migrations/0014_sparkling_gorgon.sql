ALTER TABLE "users" ADD COLUMN "profile_visibility" text DEFAULT 'everyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "who_can_dm" text DEFAULT 'everyone' NOT NULL;