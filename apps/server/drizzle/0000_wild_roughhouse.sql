CREATE TABLE "bonus_cards" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text NOT NULL,
	"effect_type" varchar(64) NOT NULL,
	"image_url" varchar(256) NOT NULL,
	"deck_count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monsters" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"management" smallint DEFAULT 0 NOT NULL,
	"communication" smallint DEFAULT 0 NOT NULL,
	"orientation" smallint DEFAULT 0 NOT NULL,
	"processing" smallint DEFAULT 0 NOT NULL,
	"movement_energy" smallint DEFAULT 0 NOT NULL,
	"image_url" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ability_name" varchar(32) NOT NULL,
	"task_number" smallint NOT NULL,
	"title" jsonb NOT NULL,
	"rewards" jsonb NOT NULL,
	"requirements" jsonb,
	"levels" jsonb NOT NULL,
	"image_refs" jsonb,
	"task_type" varchar(32) NOT NULL
);
