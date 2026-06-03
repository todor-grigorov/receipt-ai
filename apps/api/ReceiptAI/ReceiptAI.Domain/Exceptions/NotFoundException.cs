namespace ReceiptAI.Domain.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }

        public NotFoundException(string name, Guid id)
            : base($"{name} with id '{id}' was not found") { }
    }
}
