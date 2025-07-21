-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Singapore',
    "taxStatus" TEXT NOT NULL DEFAULT 'Employment Pass',
    "primaryCurrency" TEXT NOT NULL DEFAULT 'SGD',
    "birthYear" INTEGER,
    "srsLimit" DECIMAL(65,30) NOT NULL DEFAULT 35700,
    "fiGoal" DECIMAL(65,30) NOT NULL DEFAULT 2500000,
    "fiTargetYear" INTEGER NOT NULL DEFAULT 2032,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "dataQuality" INTEGER NOT NULL DEFAULT 0,
    "yearsOfData" INTEGER NOT NULL DEFAULT 0,
    "lastProfileUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoUpdatePortfolio" BOOLEAN NOT NULL DEFAULT true,
    "shareAnonymizedData" BOOLEAN NOT NULL DEFAULT false,
    "shareWithAdvisor" BOOLEAN NOT NULL DEFAULT false,
    "exportDataAllowed" BOOLEAN NOT NULL DEFAULT true,
    "srsDeadlineReminder" BOOLEAN NOT NULL DEFAULT true,
    "rebalanceReminder" BOOLEAN NOT NULL DEFAULT true,
    "fiProgressReminder" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coreTarget" INTEGER NOT NULL DEFAULT 25,
    "growthTarget" INTEGER NOT NULL DEFAULT 55,
    "hedgeTarget" INTEGER NOT NULL DEFAULT 10,
    "liquidityTarget" INTEGER NOT NULL DEFAULT 10,
    "rebalanceThreshold" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "employmentIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bonusIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "investmentIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "businessIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxesPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalExpenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "savingsRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "savingsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "housing" DECIMAL(65,30),
    "transportation" DECIMAL(65,30),
    "food" DECIMAL(65,30),
    "healthcare" DECIMAL(65,30),
    "entertainment" DECIMAL(65,30),
    "other" DECIMAL(65,30),
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "investmentSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "emergencyFund" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "srsContributions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpfContributions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "srsProvider" TEXT,
    "srsTaxSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "totalAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "portfolioValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "realEstate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "srsValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpfValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherAssets" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalLiabilities" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "mortgage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "personalLoans" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditCardDebt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherDebt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netWorth" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyName" TEXT NOT NULL,
    "coreTarget" DECIMAL(65,30) NOT NULL DEFAULT 25,
    "growthTarget" DECIMAL(65,30) NOT NULL DEFAULT 55,
    "hedgeTarget" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "liquidityTarget" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "rebalanceThreshold" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SRSPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "autoOptimize" BOOLEAN NOT NULL DEFAULT true,
    "monthlyTarget" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "preferredProvider" TEXT NOT NULL DEFAULT 'DBS',
    "projectedTotalAt62" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "projectedTaxSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "withdrawalStartAge" INTEGER,
    "withdrawalRate" DECIMAL(65,30),
    "withdrawalStrategy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SRSPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SRSContribution" (
    "id" TEXT NOT NULL,
    "srsplanId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plannedContribution" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualContribution" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxSavings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'SRS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SRSContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FIPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customFIAmount" DECIMAL(65,30) NOT NULL DEFAULT 2500000,
    "customTargetYear" INTEGER NOT NULL DEFAULT 2032,
    "leanFIAmount" DECIMAL(65,30) NOT NULL DEFAULT 1850000,
    "coastFIAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "baristaFIAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fatFIAmount" DECIMAL(65,30) NOT NULL DEFAULT 5000000,
    "singaporeExpenses" DECIMAL(65,30) NOT NULL DEFAULT 120000,
    "malaysiaExpenses" DECIMAL(65,30) NOT NULL DEFAULT 60000,
    "thailandExpenses" DECIMAL(65,30) NOT NULL DEFAULT 48000,
    "philippinesExpenses" DECIMAL(65,30) NOT NULL DEFAULT 36000,
    "customLocation" TEXT,
    "customExpenses" DECIMAL(65,30),
    "firstMillionAchieved" BOOLEAN NOT NULL DEFAULT false,
    "firstMillionAchievedDate" TIMESTAMP(3),
    "leanFIAchieved" BOOLEAN NOT NULL DEFAULT false,
    "leanFIAchievedDate" TIMESTAMP(3),
    "fullFIAchieved" BOOLEAN NOT NULL DEFAULT false,
    "fullFIAchievedDate" TIMESTAMP(3),
    "fatFIAchieved" BOOLEAN NOT NULL DEFAULT false,
    "fatFIAchievedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FIPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FIProgressRecord" (
    "id" TEXT NOT NULL,
    "fiPlanId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "netWorth" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fiProgress" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "yearsRemaining" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "projectedFIDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FIProgressRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "source" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetPercentage" DECIMAL(65,30) NOT NULL,
    "description" TEXT,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30),
    "valueSGD" DECIMAL(65,30) NOT NULL,
    "valueINR" DECIMAL(65,30) NOT NULL,
    "valueUSD" DECIMAL(65,30) NOT NULL,
    "entryCurrency" TEXT NOT NULL DEFAULT 'SGD',
    "costBasis" DECIMAL(65,30),
    "location" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentUnitPrice" DECIMAL(65,30),
    "priceSource" TEXT,
    "priceUpdated" TIMESTAMP(3),
    "unitPrice" DECIMAL(65,30),

    CONSTRAINT "Holdings_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dollarImpact" DECIMAL(65,30),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearlyData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "netWorth" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "savings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "srs" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "marketGains" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "returnPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearlyData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IncomeRecord_userId_year_idx" ON "IncomeRecord"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeRecord_userId_year_key" ON "IncomeRecord"("userId", "year");

-- CreateIndex
CREATE INDEX "ExpenseRecord_userId_year_idx" ON "ExpenseRecord"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseRecord_userId_year_key" ON "ExpenseRecord"("userId", "year");

-- CreateIndex
CREATE INDEX "SavingsRecord_userId_year_idx" ON "SavingsRecord"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsRecord_userId_year_key" ON "SavingsRecord"("userId", "year");

-- CreateIndex
CREATE INDEX "NetWorthRecord_userId_year_idx" ON "NetWorthRecord"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthRecord_userId_year_month_key" ON "NetWorthRecord"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "PortfolioStrategy_userId_isActive_idx" ON "PortfolioStrategy"("userId", "isActive");

-- CreateIndex
CREATE INDEX "SRSPlan_userId_idx" ON "SRSPlan"("userId");

-- CreateIndex
CREATE INDEX "SRSContribution_srsplanId_year_idx" ON "SRSContribution"("srsplanId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "SRSContribution_srsplanId_year_key" ON "SRSContribution"("srsplanId", "year");

-- CreateIndex
CREATE INDEX "FIPlan_userId_idx" ON "FIPlan"("userId");

-- CreateIndex
CREATE INDEX "FIProgressRecord_fiPlanId_year_idx" ON "FIProgressRecord"("fiPlanId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "FIProgressRecord_fiPlanId_year_key" ON "FIProgressRecord"("fiPlanId", "year");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_recordId_idx" ON "AuditLog"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_updatedAt_idx" ON "ExchangeRate"("fromCurrency", "toCurrency", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_key" ON "ExchangeRate"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "YearlyData_userId_year_idx" ON "YearlyData"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "YearlyData_userId_year_key" ON "YearlyData"("userId", "year");

-- AddForeignKey
ALTER TABLE "IncomeRecord" ADD CONSTRAINT "IncomeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRecord" ADD CONSTRAINT "ExpenseRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetWorthRecord" ADD CONSTRAINT "NetWorthRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioStrategy" ADD CONSTRAINT "PortfolioStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SRSPlan" ADD CONSTRAINT "SRSPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SRSContribution" ADD CONSTRAINT "SRSContribution_srsplanId_fkey" FOREIGN KEY ("srsplanId") REFERENCES "SRSPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIPlan" ADD CONSTRAINT "FIPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FIProgressRecord" ADD CONSTRAINT "FIProgressRecord_fiPlanId_fkey" FOREIGN KEY ("fiPlanId") REFERENCES "FIPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holdings" ADD CONSTRAINT "Holdings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holdings" ADD CONSTRAINT "Holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YearlyData" ADD CONSTRAINT "YearlyData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
