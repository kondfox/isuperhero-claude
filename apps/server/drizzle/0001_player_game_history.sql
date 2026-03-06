CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(10) NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"winner_id" uuid,
	"total_turns" integer,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"final_rank" integer,
	"monsters_tamed" integer DEFAULT 0,
	"total_ability_score" integer DEFAULT 0,
	"bonus_cards_used" integer DEFAULT 0,
	CONSTRAINT "game_participants_game_player_unique" UNIQUE("game_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "game_records" ADD CONSTRAINT "game_records_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_id_game_records_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."game_records"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE VIEW "leaderboard" AS
SELECT
  p.id AS player_id,
  p.display_name,
  COUNT(DISTINCT gp.game_id) AS games_played,
  COUNT(DISTINCT gr.id) FILTER (WHERE gr.winner_id = p.id) AS wins,
  COALESCE(SUM(gp.monsters_tamed), 0) AS total_monsters,
  COALESCE(MAX(gp.total_ability_score), 0) AS best_score
FROM players p
LEFT JOIN game_participants gp ON gp.player_id = p.id
LEFT JOIN game_records gr ON gr.id = gp.game_id
GROUP BY p.id, p.display_name;
