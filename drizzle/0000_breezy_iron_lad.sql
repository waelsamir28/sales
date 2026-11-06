CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" varchar(20) NOT NULL,
	"check_in" varchar(20) DEFAULT '' NOT NULL,
	"check_out" varchar(20) DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"party_type" varchar(20) DEFAULT 'other' NOT NULL,
	"party_id" integer,
	"party_name" varchar(200) DEFAULT '' NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"treasury_id" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(40) DEFAULT '' NOT NULL,
	"address" varchar(300) DEFAULT '' NOT NULL,
	"discount_percent" numeric(6, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(40) DEFAULT '' NOT NULL,
	"job_title" varchar(120) DEFAULT 'موظف' NOT NULL,
	"salary" numeric(12, 2) DEFAULT '0' NOT NULL,
	"hire_date" varchar(20) DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(80) NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"treasury_id" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"installment_id" integer NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"treasury_id" integer NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"invoice_id" integer,
	"title" varchar(200) NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"down_payment" numeric(14, 2) DEFAULT '0' NOT NULL,
	"remaining" numeric(14, 2) DEFAULT '0' NOT NULL,
	"months" integer DEFAULT 3 NOT NULL,
	"monthly_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"start_date" varchar(20) DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"code" varchar(40) DEFAULT '' NOT NULL,
	"name" varchar(200) NOT NULL,
	"unit" varchar(40) DEFAULT 'عدد' NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"qty" numeric(12, 2) DEFAULT '1' NOT NULL,
	"tax_percent" numeric(6, 2) DEFAULT '0' NOT NULL,
	"tax_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"party_id" integer,
	"party_name" varchar(200) DEFAULT 'نقدي' NOT NULL,
	"warehouse_id" integer NOT NULL,
	"treasury_id" integer NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_type" varchar(20) DEFAULT 'cash' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"delivery" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"remaining" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'saved' NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"qty_total" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"barcode" varchar(40) DEFAULT '' NOT NULL,
	"name" varchar(200) NOT NULL,
	"category_id" integer NOT NULL,
	"unit" varchar(40) DEFAULT 'عدد' NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_percent" numeric(6, 2) DEFAULT '0' NOT NULL,
	"stock" numeric(12, 2) DEFAULT '0' NOT NULL,
	"min_stock" numeric(12, 2) DEFAULT '5' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sale_only" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(80) NOT NULL,
	"value" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(40) DEFAULT '' NOT NULL,
	"address" varchar(300) DEFAULT '' NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasuries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(80) NOT NULL,
	"password" varchar(80) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" varchar(40) DEFAULT 'cashier' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_warehouse_id" integer NOT NULL,
	"to_warehouse_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"qty" numeric(12, 2) DEFAULT '1' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL
);
