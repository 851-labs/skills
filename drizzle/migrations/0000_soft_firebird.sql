CREATE TABLE `owners` (
	`id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`type` text NOT NULL,
	`avatar_url` text,
	`html_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `repos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`description` text,
	`html_url` text NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`default_branch` text DEFAULT 'main' NOT NULL,
	`is_fork` integer DEFAULT false NOT NULL,
	`license` text,
	`last_synced_at` integer,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skill_tags` (
	`skill_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`skill_id`, `tag_id`),
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`repo_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`path` text NOT NULL,
	`github_url` text NOT NULL,
	`raw_url` text NOT NULL,
	`license` text,
	`category` text,
	`compatibility` text,
	`metadata` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`repo_id`) REFERENCES `repos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);