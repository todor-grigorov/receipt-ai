namespace ReceiptAI.Application.DataTransferObjects
{
    public record UploadReceiptRequest(
     Stream FileStream,
     string FileName,
     string ContentType,
     long FileSizeBytes,
     string UserId
 );
}
