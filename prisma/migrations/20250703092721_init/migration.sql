-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- Add new currency columns as NULLABLE first
ALTER TABLE "Holdings" ADD COLUMN "valueSGD" DECIMAL(65,30);
ALTER TABLE "Holdings" ADD COLUMN "valueINR" DECIMAL(65,30);
ALTER TABLE "Holdings" ADD COLUMN "valueUSD" DECIMAL(65,30);
ALTER TABLE "Holdings" ADD COLUMN "entryCurrency" TEXT DEFAULT 'SGD';

-- Migrate existing data (assuming current 'value' is in SGD)
UPDATE "Holdings" SET 
    "valueSGD" = "value",
    "valueINR" = "value" * 63.50,  -- Approximate SGD to INR rate
    "valueUSD" = "value" * 0.74,   -- Approximate SGD to USD rate
    "entryCurrency" = 'SGD'
WHERE "valueSGD" IS NULL;

-- Now make the columns NOT NULL after data is populated
ALTER TABLE "Holdings" ALTER COLUMN "valueSGD" SET NOT NULL;
ALTER TABLE "Holdings" ALTER COLUMN "valueINR" SET NOT NULL;
ALTER TABLE "Holdings" ALTER COLUMN "valueUSD" SET NOT NULL;
ALTER TABLE "Holdings" ALTER COLUMN "entryCurrency" SET NOT NULL;

-- Remove the old value column
ALTER TABLE "Holdings" DROP COLUMN "value";

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_key" ON "ExchangeRate"("fromCurrency", "toCurrency");

-- CreateIndex  
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_updatedAt_idx" ON "ExchangeRate"("fromCurrency", "toCurrency", "updatedAt");

-- Insert initial exchange rates
INSERT INTO "ExchangeRate" ("id", "fromCurrency", "toCurrency", "rate", "source", "isActive") VALUES
    (gen_random_uuid(), 'SGD', 'USD', 0.74, 'api', true),
    (gen_random_uuid(), 'SGD', 'INR', 63.50, 'api', true),
    (gen_random_uuid(), 'USD', 'SGD', 1.35, 'api', true),
    (gen_random_uuid(), 'USD', 'INR', 85.50, 'api', true),
    (gen_random_uuid(), 'INR', 'SGD', 0.0157, 'api', true),
    (gen_random_uuid(), 'INR', 'USD', 0.0117, 'api', true);