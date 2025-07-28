-- CreateTable
CREATE TABLE "UserPattern" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examples" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionHistory" (
    "id" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "patternUsed" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("id")
);
