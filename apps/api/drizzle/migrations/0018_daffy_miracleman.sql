ALTER TABLE "roles" ADD COLUMN "moderate_members" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "server_members" ADD COLUMN "muted_until" timestamp with time zone;