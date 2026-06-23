namespace ReceiptAI.IntegrationTests
{
    /// <summary>
    /// Mutable holder for the "current" fake authenticated user during 
    /// integration tests. Set this before making an HTTP request to control 
    /// which identity TestAuthHandler injects into that request.
    /// </summary>
    public class TestAuthContext
    {
        public const string DefaultUserId = "test-user-id-123";
        public const string DefaultUserEmail = "test@example.com";

        public string CurrentUserId { get; set; } = DefaultUserId;
        public string CurrentUserEmail { get; set; } = DefaultUserEmail;
    }
}
