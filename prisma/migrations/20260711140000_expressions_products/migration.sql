-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "featuredCourseId" TEXT,
ADD COLUMN     "visionBody" TEXT;

-- AlterTable
ALTER TABLE "Testimony" ADD COLUMN     "programId" TEXT;

-- CreateTable
CREATE TABLE "ProgramFaq" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCourseFeature" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramCourseFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramEventFeature" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramEventFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramResourceFeature" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramResourceFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramFaq_programId_idx" ON "ProgramFaq"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCourseFeature_programId_courseId_key" ON "ProgramCourseFeature"("programId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEventFeature_programId_eventId_key" ON "ProgramEventFeature"("programId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramResourceFeature_programId_resourceId_key" ON "ProgramResourceFeature"("programId", "resourceId");

-- CreateIndex
CREATE INDEX "Testimony_programId_idx" ON "Testimony"("programId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_featuredCourseId_fkey" FOREIGN KEY ("featuredCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramFaq" ADD CONSTRAINT "ProgramFaq_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourseFeature" ADD CONSTRAINT "ProgramCourseFeature_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourseFeature" ADD CONSTRAINT "ProgramCourseFeature_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEventFeature" ADD CONSTRAINT "ProgramEventFeature_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramEventFeature" ADD CONSTRAINT "ProgramEventFeature_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramResourceFeature" ADD CONSTRAINT "ProgramResourceFeature_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramResourceFeature" ADD CONSTRAINT "ProgramResourceFeature_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimony" ADD CONSTRAINT "Testimony_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

