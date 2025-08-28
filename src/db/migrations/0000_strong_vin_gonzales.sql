CREATE TABLE `address` (
    `address_id` text PRIMARY KEY NOT NULL,
    `floor` text,
    `plot_no` text,
    `society_name` text,
    `lane` text,
    `address` text,
    `area` text,
    `city` text,
    `state` text,
    `pincode` text,
    `location_link` text,
    `address_type` text NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer` (
    `customer_id` text PRIMARY KEY NOT NULL,
    `address_id` text NOT NULL,
    `company_name` text,
    `customer_name` text,
    `mobile_no` text,
    `gst_no` text,
    `work_type` text,
    `machine_type` text,
    `making` text,
    `material_usage` text,
    `type` text,
    `color` text,
    `sub_tone_color` text,
    `sub_metallic_color` text,
    `taste` text,
    `size` text,
    `range` text,
    `usage_value_monthly` text,
    `payment_cycle` text,
    `open_for_collab` text,
    `customer_sale_choice` text,
    `customer_sale_method` text,
    `notes` text,
    `files` text,
    `product_images` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
    `order_id` text PRIMARY KEY NOT NULL,
    `customer_id` text,
    `supplier_id` text,
    `images` text,
    `product_name` text,
    `type` text,
    `sample` text,
    `stage` text,
    `description` text,
    `target_date` integer,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`supplier_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `product` (
    `product_id` text PRIMARY KEY NOT NULL,
    `product_name` text,
    `moq` text,
    `product_pattern` text,
    `main_category` text,
    `type` text,
    `color` text,
    `sub_metallic_color` text,
    `sub_tone_color` text,
    `size` text,
    `jari_base` text,
    `images` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier` (
    `supplier_id` text PRIMARY KEY NOT NULL,
    `address_id` text NOT NULL,
    `company_name` text,
    `supplier_name` text,
    `mobile_no` text,
    `gst_no` text,
    `work_type` text,
    `product_pattern` text,
    `supplier_machine_type` text,
    `main_category` text,
    `jari_base` text,
    `cording_base` text,
    `type` text,
    `stock` text,
    `production_capacity` text,
    `supplier_product_gallery` text,
    `notes` text,
    `files` text,
    `images` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`address_id`) REFERENCES `address` (`address_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
    `id` text PRIMARY KEY NOT NULL,
    `username` text NOT NULL,
    `password` text NOT NULL,
    `token` text,
    `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_token_unique` ON `users` (`token`);