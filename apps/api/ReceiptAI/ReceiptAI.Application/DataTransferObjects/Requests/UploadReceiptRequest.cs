namespace ReceiptAI.Application.DataTransferObjects.Requests
{
    public record UploadReceiptRequest(
     Stream FileStream,
     string FileName,
     string ContentType,
     long FileSizeBytes,
     string UserId
 );
}
