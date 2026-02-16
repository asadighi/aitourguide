-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('end_user', 'ad_provider', 'admin');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('google', 'apple');

-- CreateEnum
CREATE TYPE "LandmarkCategory" AS ENUM ('monument', 'building', 'natural', 'religious', 'historical', 'cultural', 'other');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'end_user',
    "oauth_provider" "OAuthProvider" NOT NULL,
    "oauth_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landmarks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "category" "LandmarkCategory" NOT NULL DEFAULT 'other',
    "first_identified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_contents" (
    "id" TEXT NOT NULL,
    "landmark_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "facts" JSONB NOT NULL,
    "narration_script" TEXT NOT NULL,
    "fun_fact" TEXT,
    "admin_prompt" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_narrations" (
    "id" TEXT NOT NULL,
    "guide_content_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "duration_ms" INTEGER,
    "voice_id" TEXT NOT NULL DEFAULT 'alloy',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_narrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'pending',
    "admin_feedback" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_landmarks" (
    "ad_id" TEXT NOT NULL,
    "landmark_id" TEXT NOT NULL,

    CONSTRAINT "ad_landmarks_pkey" PRIMARY KEY ("ad_id","landmark_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guide_content_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "schema_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_provider_oauth_id_key" ON "users"("oauth_provider", "oauth_id");

-- CreateIndex
CREATE INDEX "guide_contents_landmark_id_locale_is_active_idx" ON "guide_contents"("landmark_id", "locale", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "guide_contents_landmark_id_locale_version_key" ON "guide_contents"("landmark_id", "locale", "version");

-- CreateIndex
CREATE UNIQUE INDEX "audio_narrations_guide_content_id_key" ON "audio_narrations"("guide_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_guide_content_id_key" ON "reviews"("user_id", "guide_content_id");

-- CreateIndex
CREATE INDEX "prompts_prompt_id_is_active_idx" ON "prompts"("prompt_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "prompts_prompt_id_version_key" ON "prompts"("prompt_id", "version");

-- AddForeignKey
ALTER TABLE "guide_contents" ADD CONSTRAINT "guide_contents_landmark_id_fkey" FOREIGN KEY ("landmark_id") REFERENCES "landmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_narrations" ADD CONSTRAINT "audio_narrations_guide_content_id_fkey" FOREIGN KEY ("guide_content_id") REFERENCES "guide_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_landmarks" ADD CONSTRAINT "ad_landmarks_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_landmarks" ADD CONSTRAINT "ad_landmarks_landmark_id_fkey" FOREIGN KEY ("landmark_id") REFERENCES "landmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guide_content_id_fkey" FOREIGN KEY ("guide_content_id") REFERENCES "guide_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
