ALTER TABLE "roles" ADD COLUMN "manage_assignments" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "roles" SET "manage_assignments" = true WHERE "manage_channels" = true;