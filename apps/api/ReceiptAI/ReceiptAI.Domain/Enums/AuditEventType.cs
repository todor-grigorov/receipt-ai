namespace ReceiptAI.Domain.Enums
{
    public enum AuditEventType
    {
        ReceiptUploaded,
        JobCreated,
        BlobStored,
        JobProcessingStarted,
        LlmRequestSent,
        LlmResponseReceived,
        LlmParsingCompleted,
        JobCompleted,
        JobFailed,
        ResultRetrieved
    }
}
