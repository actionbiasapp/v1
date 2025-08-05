-- CreateTable
CREATE TABLE "FIMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FIMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FIMilestone_userId_order_idx" ON "FIMilestone"("userId", "order");

-- AddForeignKey
ALTER TABLE "FIMilestone" ADD CONSTRAINT "FIMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
