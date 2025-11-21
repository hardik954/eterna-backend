-- CreateIndex
CREATE INDEX "ExecutionLog_orderId_timestamp_idx" ON "ExecutionLog"("orderId", "timestamp");

-- CreateIndex
CREATE INDEX "ExecutionLog_timestamp_idx" ON "ExecutionLog"("timestamp");

-- CreateIndex
CREATE INDEX "UserOrder_createdAt_idx" ON "UserOrder"("createdAt");
