CREATE TABLE `area` (
	`area_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `area_name_unique` ON `area` (`name`);--> statement-breakpoint
ALTER TABLE `customer` ADD `area_id` text REFERENCES area(area_id);--> statement-breakpoint
-- First add the column without NOT NULL constraint
ALTER TABLE `product` ADD `supplier_id` text REFERENCES supplier(supplier_id);
-- We'll need to update existing rows with valid supplier_id values before adding the NOT NULL constraint--> statement-breakpoint
ALTER TABLE `product` ADD `vnu_product_name` text;--> statement-breakpoint
ALTER TABLE `product` ADD `purchase_rate` text;--> statement-breakpoint
ALTER TABLE `product` ADD `sales_rate` text;