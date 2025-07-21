-- CreateTable
CREATE TABLE "CronJobLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronJobLog_jobName_runAt_idx" ON "CronJobLog"("jobName", "runAt");
