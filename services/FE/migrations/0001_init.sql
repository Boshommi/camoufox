-- CreateTable
CREATE TABLE "CanvasFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "pixelData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "canvas_render" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprintId" TEXT NOT NULL,
    "deviceInfo" TEXT NOT NULL,
    "dataURL" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "canvas_render_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "CanvasFingerprint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CanvasFingerprint_hash_key" ON "CanvasFingerprint"("hash");
