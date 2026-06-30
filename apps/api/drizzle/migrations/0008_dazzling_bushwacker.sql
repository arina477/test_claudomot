ALTER TABLE "messages" ADD COLUMN "thread_parent_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "last_reply_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_parent_id_messages_id_fk" FOREIGN KEY ("thread_parent_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_thread_parent_created_idx" ON "messages" USING btree ("thread_parent_id","created_at");