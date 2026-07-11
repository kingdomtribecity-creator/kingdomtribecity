-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYSTACK');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('EMAIL', 'PAYMENTS', 'AI', 'SMS');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "paymentProvider" "PaymentProvider",
ADD COLUMN     "paystackReference" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paystackReference" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE';

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretsEncrypted" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_type_provider_key" ON "Integration"("type", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_paystackReference_key" ON "Enrollment"("paystackReference");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paystackReference_key" ON "Transaction"("paystackReference");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

