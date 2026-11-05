-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oneLiner" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "website" TEXT,
    "teamSize" INTEGER NOT NULL,
    "raisingAmount" INTEGER NOT NULL,
    "traction" TEXT NOT NULL,
    "pitchText" TEXT NOT NULL DEFAULT '',
    "deckFile" TEXT,
    "deckOriginal" TEXT,
    "videoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "thesis" TEXT NOT NULL,
    "chequeMin" INTEGER NOT NULL,
    "chequeMax" INTEGER NOT NULL,
    "sectors" TEXT NOT NULL,
    "stages" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VcProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "vcId" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "offeredAmount" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Startup_ownerId_key" ON "Startup"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Startup_deckFile_key" ON "Startup"("deckFile");

-- CreateIndex
CREATE UNIQUE INDEX "VcProfile_userId_key" ON "VcProfile"("userId");

-- CreateIndex
CREATE INDEX "Deal_startupId_idx" ON "Deal"("startupId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_vcId_startupId_key" ON "Deal"("vcId", "startupId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcProfile" ADD CONSTRAINT "VcProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_vcId_fkey" FOREIGN KEY ("vcId") REFERENCES "VcProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
