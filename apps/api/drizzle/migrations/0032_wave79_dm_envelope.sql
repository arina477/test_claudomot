ALTER TABLE "dm_messages" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "ciphertext" text;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "sender_key_ref" text;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "envelope_version" integer;--> statement-breakpoint
ALTER TABLE "dm_messages" ADD COLUMN "deleted_at" timestamp with time zone;