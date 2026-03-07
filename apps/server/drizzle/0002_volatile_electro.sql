CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "is_activated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_display_name_unique" UNIQUE("display_name");--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
