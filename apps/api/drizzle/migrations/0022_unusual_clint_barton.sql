CREATE TABLE "server_study_timer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"phase" text DEFAULT 'work' NOT NULL,
	"run_state" text DEFAULT 'idle' NOT NULL,
	"started_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"paused_remaining_ms" integer,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "server_study_timer_server_id_unique" UNIQUE("server_id")
);
--> statement-breakpoint
ALTER TABLE "server_study_timer" ADD CONSTRAINT "server_study_timer_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_study_timer" ADD CONSTRAINT "server_study_timer_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;