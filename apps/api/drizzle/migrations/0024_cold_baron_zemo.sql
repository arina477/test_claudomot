ALTER TABLE "servers" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "topic" text;--> statement-breakpoint
CREATE INDEX "servers_is_public_idx" ON "servers" USING btree ("is_public");