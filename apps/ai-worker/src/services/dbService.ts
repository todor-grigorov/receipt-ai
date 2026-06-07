import { Pool } from "pg";
import { config } from "../config";
import { ReceiptResult } from "../models/receiptResult";

const pool = new Pool({ connectionString: config.DATABASE_URL });

export async function saveReceiptResult(
  correlationId: string,
  userId: string,
  originalFileName: string,
  result: ReceiptResult,
): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert receipt
    const receiptResult = await client.query(
      `INSERT INTO "Receipts" (
                "Id",
                "JobId",
                "UserId",
                "OriginalFileName",
                "MerchantName",
                "ReceiptDate",
                "Total",
                "Tax",
                "Currency",
                "RawLlmResponse",
                "CreatedAt",
                "UpdatedAt"
            ) VALUES (
                gen_random_uuid(),
                (SELECT "Id" FROM "Jobs" WHERE "CorrelationId" = $1),
                $2, $3, $4, $5, $6, $7, $8, $9,
                NOW(), NOW()
            ) RETURNING "Id"`,
      [
        correlationId,
        userId,
        originalFileName,
        result.merchantName,
        result.receiptDate,
        result.total,
        result.tax,
        result.currency,
        result.rawLlmResponse,
      ],
    );

    const receiptId = receiptResult.rows[0].Id;

    // Insert line items
    for (const item of result.lineItems) {
      await client.query(
        `INSERT INTO "ReceiptLineItems" (
                    "Id",
                    "ReceiptId",
                    "Description",
                    "Quantity",
                    "UnitPrice",
                    "TotalPrice",
                    "CreatedAt",
                    "UpdatedAt"
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
                )`,
        [
          receiptId,
          item.description,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ],
      );
    }

    await client.query("COMMIT");

    return receiptId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateJobStatus(
  correlationId: string,
  status: string,
  errorMessage?: string,
): Promise<void> {
  await pool.query(
    `UPDATE "Jobs"
         SET "Status" = $1,
             "ErrorMessage" = $2,
             "UpdatedAt" = NOW()
         WHERE "CorrelationId" = $3`,
    [status, errorMessage ?? null, correlationId],
  );
}
