-- Phase 3: dynamic course engine.
--
-- The existing 3-course "Planted/Rooted/Formed" structure is being
-- consolidated into a single "Rooted and Built" course with 4 stage-tagged
-- modules (see prisma/seed.ts), and Cohort becomes required-scoped to a
-- Course. Rather than attempt a lossy in-place reshape of demo/seed data,
-- clear the course- and cohort-scoped rows here (via already-existing
-- cascade FKs) and let the reseed rebuild them fresh in the new shape.
-- Users, Programs, Resources, MediaAssets, Permissions, Events, and
-- Testimonies are untouched.
DELETE FROM "Course";
DELETE FROM "Cohort";

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('SELF_PACED', 'COHORT_BASED', 'CHALLENGE', 'INTENSIVE', 'CERTIFICATION');

-- CreateEnum
CREATE TYPE "CourseAccessLevel" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "cohortId" TEXT;

-- AlterTable (Course and Cohort tables are empty at this point, so the new
-- NOT NULL columns below are trivially satisfied — no backfill needed.)
ALTER TABLE "Cohort" DROP COLUMN "active",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "status" "CohortStatus" NOT NULL DEFAULT 'UPCOMING';

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "published",
ADD COLUMN     "accessLevel" "CourseAccessLevel" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "category" TEXT,
ADD COLUMN     "certificateEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "difficulty" "CourseDifficulty",
ADD COLUMN     "durationLabel" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "format" "CourseFormat" NOT NULL DEFAULT 'SELF_PACED',
ADD COLUMN     "priceCents" INTEGER,
ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "stage" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "cohortId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "cohortId" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "prayerPrompt" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "stage" "Stage";

-- AlterTable: Program.slug converts from a fixed enum to freeform text in
-- place (preserving the existing unique index), normalizing the 4 existing
-- rows to their new lowercase-hyphen slugs so seed upserts update them
-- rather than creating duplicates.
ALTER TABLE "Program" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Program" ALTER COLUMN "slug" TYPE TEXT USING (
  CASE "slug"::text
    WHEN 'PLANTED_AND_ROOTED' THEN 'rooted-and-built'
    WHEN 'YOUNG_AND_YIELDED' THEN 'young-and-yielded'
    WHEN 'KINGDOM_WARRIOR_WOMAN' THEN 'kingdom-warrior-woman'
    WHEN 'KINGDOM_LEADERS' THEN 'kingdom-leaders'
    ELSE lower("slug"::text)
  END
);
DROP TYPE "ProgramSlug";

-- AlterTable
ALTER TABLE "Resource" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CourseMentor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CourseMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonResource" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passScorePercent" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scorePercent" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseMentor_courseId_userId_key" ON "CourseMentor"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonResource_lessonId_resourceId_key" ON "LessonResource"("lessonId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lessonId_key" ON "Quiz"("lessonId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_userId_idx" ON "QuizAttempt"("quizId", "userId");

-- CreateIndex
CREATE INDEX "Announcement_cohortId_idx" ON "Announcement"("cohortId");

-- CreateIndex
CREATE INDEX "Cohort_courseId_idx" ON "Cohort"("courseId");

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_stripeCheckoutSessionId_key" ON "Enrollment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Enrollment_cohortId_idx" ON "Enrollment"("cohortId");

-- CreateIndex
CREATE INDEX "Event_cohortId_idx" ON "Event"("cohortId");

-- AddForeignKey
ALTER TABLE "CourseMentor" ADD CONSTRAINT "CourseMentor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMentor" ADD CONSTRAINT "CourseMentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
