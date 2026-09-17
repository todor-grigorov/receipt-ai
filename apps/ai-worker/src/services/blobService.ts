import { BlobSASPermissions, BlobServiceClient } from "@azure/storage-blob";
import { config } from "../config";

export async function generateSasUrl(blobUrl: string): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    config.AZURE_STORAGE_CONNECTION_STRING,
  );

  // Extract container and blob name from URL
  const url = new URL(blobUrl);
  const pathParts = url.pathname.split("/");
  const containerName = pathParts[1]; // "receipts"
  const blobName = pathParts.slice(2).join("/"); // "userId/correlationId.jpg"

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  // Generate SAS URL valid for 1 hour
  const sasUrl = await blobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse("r"),
    expiresOn: new Date(Date.now() + 3600 * 1000),
  });

  return sasUrl;
}
