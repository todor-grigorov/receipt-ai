using AutoMapper;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Application.Services;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Domain.Exceptions;

namespace ReceiptAI.UnitTests.Application
{
    public class ReceiptServiceTests
    {
        private readonly IRepositoryManager _repository;
        private readonly IReceiptRepository _receiptRepository;
        private readonly IJobService _jobService;
        private readonly IAuditService _auditService;
        private readonly IBlobService _blobService;
        private readonly ICurrentUserService _currentUser;
        private readonly IMapper _mapper;
        private readonly ReceiptService _sut;

        private const string CurrentUserId = "user-123";

        public ReceiptServiceTests()
        {
            _repository = Substitute.For<IRepositoryManager>();
            _receiptRepository = Substitute.For<IReceiptRepository>();
            _jobService = Substitute.For<IJobService>();
            _auditService = Substitute.For<IAuditService>();
            _blobService = Substitute.For<IBlobService>();
            _currentUser = Substitute.For<ICurrentUserService>();
            _mapper = Substitute.For<IMapper>();

            _repository.Receipt.Returns(_receiptRepository);
            _currentUser.UserId.Returns(CurrentUserId);

            _sut = new ReceiptService(
                _repository, _jobService, _auditService, _blobService, _currentUser, _mapper);
        }

        private static Receipt CreateReceipt(string userId, Guid correlationId, string blobUrl = "https://storage/blob.jpg") =>
            new()
            {
                Id = Guid.NewGuid(),
                CorrelationId = correlationId,
                UserId = userId,
                Job = new Job { CorrelationId = correlationId, BlobUrl = blobUrl }
            };

        // ── GetByIdAsync ──────────────────────────────────────

        [Fact]
        public async Task GetByIdAsync_ShouldReturnReceiptWithSasUrl_WhenOwnedByCurrentUser()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            var correlationId = Guid.NewGuid();
            var receipt = CreateReceipt(CurrentUserId, correlationId);
            var sasUrl = "https://storage/blob.jpg?sas=token";

            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns(receipt);
            _blobService.GenerateSasUrlAsync(receipt.Job.BlobUrl, Arg.Any<CancellationToken>())
                .Returns(sasUrl);
            _mapper.Map<ReceiptResponse>(receipt).Returns(new ReceiptResponse(
                receipt.Id, correlationId, "Coop", null, 10, null, "CHF", null, [], DateTimeOffset.UtcNow));

            // Act
            var result = await _sut.GetByIdAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            result.BlobUrl.Should().Be(sasUrl);

            await _auditService.Received(1).LogAsync(
                correlationId,
                AuditEventType.ResultRetrieved,
                service: Arg.Any<string>(),
                actor: $"user:{CurrentUserId}",
                payload: Arg.Any<object?>(),
                isSuccess: Arg.Any<bool>(),
                errorMessage: Arg.Any<string?>(),
                ct: Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowNotFoundException_WhenReceiptDoesNotExist()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns((Receipt?)null);

            // Act
            var act = async () => await _sut.GetByIdAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"Receipt {receiptId} not found");
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowUnauthorizedException_WhenUserDoesNotOwnReceipt()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            var receipt = CreateReceipt("a-different-user", Guid.NewGuid());

            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns(receipt);

            // Act
            var act = async () => await _sut.GetByIdAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Access denied");
        }

        // ── GetByUserIdAsync ──────────────────────────────────

        [Fact]
        public async Task GetByUserIdAsync_ShouldReturnMappedReceipts_ForGivenUser()
        {
            // Arrange
            var receipts = new List<Receipt>
    {
        CreateReceipt(CurrentUserId, Guid.NewGuid()),
        CreateReceipt(CurrentUserId, Guid.NewGuid())
    };

            var expectedResponses = receipts.Select(r =>
                new ReceiptResponse(r.Id, r.CorrelationId, "Coop", null, 10, null, "CHF", null, [], DateTimeOffset.UtcNow));

            _receiptRepository.GetByUserIdAsync(CurrentUserId, 1, 10, Arg.Any<CancellationToken>())
                .Returns(receipts);
            _mapper.Map<IEnumerable<ReceiptResponse>>(receipts).Returns(expectedResponses);

            // Act
            var result = await _sut.GetByUserIdAsync(CurrentUserId, 1, 10, TestContext.Current.CancellationToken);

            // Assert
            result.Should().BeEquivalentTo(expectedResponses);
        }

        [Fact]
        public async Task GetByUserIdAsync_ShouldReturnEmptyCollection_WhenUserHasNoReceipts()
        {
            // Arrange
            _receiptRepository.GetByUserIdAsync(CurrentUserId, 1, 10, Arg.Any<CancellationToken>())
                .Returns(new List<Receipt>());
            _mapper.Map<IEnumerable<ReceiptResponse>>(Arg.Any<IEnumerable<Receipt>>())
                .Returns(new List<ReceiptResponse>());

            // Act
            var result = await _sut.GetByUserIdAsync(CurrentUserId, 1, 10, TestContext.Current.CancellationToken);

            // Assert
            result.Should().BeEmpty();
        }

        // ── GetByCorrelationIdAsync ───────────────────────────

        [Fact]
        public async Task GetByCorrelationIdAsync_ShouldReturnMappedReceipt_WhenOwnedByCurrentUser()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var receipt = CreateReceipt(CurrentUserId, correlationId);
            var expectedResponse = new ReceiptResponse(
                receipt.Id, correlationId, "Coop", null, 10, null, "CHF", null, [], DateTimeOffset.UtcNow);

            _receiptRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(receipt);
            _mapper.Map<ReceiptResponse>(receipt).Returns(expectedResponse);

            // Act
            var result = await _sut.GetByCorrelationIdAsync(correlationId, TestContext.Current.CancellationToken);

            // Assert
            result.Should().Be(expectedResponse);
        }

        [Fact]
        public async Task GetByCorrelationIdAsync_ShouldThrowNotFoundException_WhenReceiptDoesNotExist()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            _receiptRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns((Receipt?)null);

            // Act
            var act = async () => await _sut.GetByCorrelationIdAsync(correlationId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"Receipt for correlationId {correlationId} not found");
        }

        [Fact]
        public async Task GetByCorrelationIdAsync_ShouldThrowUnauthorizedException_WhenUserDoesNotOwnReceipt()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var receipt = CreateReceipt("a-different-user", correlationId);

            _receiptRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(receipt);

            // Act
            var act = async () => await _sut.GetByCorrelationIdAsync(correlationId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Access denied");
        }

        // ── UploadAsync ───────────────────────────────────────

        [Fact]
        public async Task UploadAsync_ShouldUploadBlobAndLogAuditEvents_AndCreateJob()
        {
            // Arrange
            var blobUrl = "https://storage/receipts/new.jpg";
            using var stream = new MemoryStream();

            var request = new UploadReceiptRequest(stream, "receipt.jpg", "image/jpeg", 1024, CurrentUserId);

            _blobService.UploadAsync(
                    stream, request.FileName, request.ContentType, CurrentUserId,
                    Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                .Returns(blobUrl);

            // Act
            var result = await _sut.UploadAsync(request, TestContext.Current.CancellationToken);

            // Assert
            result.BlobUrl.Should().Be(blobUrl);
            result.Id.Should().Be(Guid.Empty); // placeholder response, real data not yet processed

            await _auditService.Received(1).LogAsync(
                Arg.Any<Guid>(),
                AuditEventType.ReceiptUploaded,
                service: Arg.Any<string>(),
                actor: $"user:{CurrentUserId}",
                payload: Arg.Any<object?>(),
                isSuccess: Arg.Any<bool>(),
                errorMessage: Arg.Any<string?>(),
                ct: Arg.Any<CancellationToken>());

            await _auditService.Received(1).LogAsync(
                Arg.Any<Guid>(),
                AuditEventType.BlobStored,
                service: Arg.Any<string>(),
                actor: $"user:{CurrentUserId}",
                payload: Arg.Any<object?>(),
                isSuccess: Arg.Any<bool>(),
                errorMessage: Arg.Any<string?>(),
                ct: Arg.Any<CancellationToken>());

            await _jobService.Received(1).CreateAsync(
                Arg.Any<Guid>(), CurrentUserId, blobUrl, Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task UploadAsync_ShouldDeleteBlobAndRethrow_WhenJobCreationFails()
        {
            // Arrange
            var blobUrl = "https://storage/receipts/new.jpg";
            using var stream = new MemoryStream();

            var request = new UploadReceiptRequest(stream, "receipt.jpg", "image/jpeg", 1024, CurrentUserId);

            _blobService.UploadAsync(
                    stream, request.FileName, request.ContentType, CurrentUserId,
                    Arg.Any<Guid>(), Arg.Any<CancellationToken>())
                .Returns(blobUrl);

            _jobService.CreateAsync(Arg.Any<Guid>(), CurrentUserId, blobUrl, Arg.Any<CancellationToken>())
                .ThrowsAsync(new InvalidOperationException("DB write failed"));

            // Act
            var act = async () => await _sut.UploadAsync(request, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("DB write failed");

            await _blobService.Received(1).DeleteAsync(blobUrl, Arg.Any<CancellationToken>());
        }

        // ── DeleteAsync ───────────────────────────────────────

        [Fact]
        public async Task DeleteAsync_ShouldDeleteBlobAndReceipt_WhenOwnedByCurrentUser()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            var receipt = CreateReceipt(CurrentUserId, Guid.NewGuid(), "https://storage/blob.jpg");

            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns(receipt);

            // Act
            await _sut.DeleteAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            await _blobService.Received(1).DeleteAsync(receipt.Job.BlobUrl, Arg.Any<CancellationToken>());
            await _receiptRepository.Received(1).DeleteAsync(receiptId, Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task DeleteAsync_ShouldThrowUnauthorizedException_WhenUserDoesNotOwnReceipt()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            var receipt = CreateReceipt("a-different-user", Guid.NewGuid());

            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns(receipt);

            // Act
            var act = async () => await _sut.DeleteAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Access denied");

            await _blobService.DidNotReceive().DeleteAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task DeleteAsync_ShouldThrowNotFoundException_WhenReceiptDoesNotExist()
        {
            // Arrange
            var receiptId = Guid.NewGuid();
            _receiptRepository.GetByIdAsync(receiptId, Arg.Any<CancellationToken>())
                .Returns((Receipt?)null);

            // Act
            var act = async () => await _sut.DeleteAsync(receiptId, TestContext.Current.CancellationToken);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"Receipt {receiptId} not found");
        }

        // ── CountByUserIdAsync ────────────────────────────────

        [Fact]
        public async Task CountByUserIdAsync_ShouldReturnCountFromRepository()
        {
            // Arrange
            _receiptRepository.CountByUserIdAsync(CurrentUserId, Arg.Any<CancellationToken>())
                .Returns(3);

            // Act
            var result = await _sut.CountByUserIdAsync(CurrentUserId, TestContext.Current.CancellationToken);

            // Assert
            result.Should().Be(3);
        }
    }
}
