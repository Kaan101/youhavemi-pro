-- YouHaveMi Pro ilk kurulum migration'i.

CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "webhook_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_api_key_hash_key" ON "tenants"("api_key_hash");

CREATE TABLE IF NOT EXISTS "platform_policy" (
    "id" TEXT NOT NULL,
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_policy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "participants" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "phone_number_hash" TEXT,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "participants_tenant_id_phone_number_hash_idx" ON "participants"("tenant_id", "phone_number_hash");
CREATE INDEX IF NOT EXISTS "participants_tenant_id_external_id_idx" ON "participants"("tenant_id", "external_id");

DO $$ BEGIN
  CREATE TYPE "AnonymitySide" AS ENUM ('sender', 'both', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "participant_a_id" UUID NOT NULL,
    "participant_b_id" UUID,
    "anonymity_side" "AnonymitySide" NOT NULL DEFAULT 'sender',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body_encrypted" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "messages_conversation_id_idx" ON "messages"("conversation_id");

DO $$ BEGIN
  ALTER TABLE "participants" ADD CONSTRAINT "participants_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "participants"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
