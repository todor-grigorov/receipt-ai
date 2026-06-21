using FluentAssertions;
using NSubstitute;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Services;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using System.Text.Json;

namespace ReceiptAI.UnitTests.Application
{
    public class AuditServiceTests
    {
        private readonly IRepositoryManager _repository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly AuditService _sut;

        public AuditServiceTests()
        {
            _repository = Substitute.For<IRepositoryManager>();
            _auditLogRepository = Substitute.For<IAuditLogRepository>();

            _repository.AuditLog.Returns(_auditLogRepository);

            _sut = new AuditService(_repository);
        }

        // ── LogAsync ──────────────────────────────────────────

        [Fact]
        public async Task LogAsync_ShouldCreateAuditLog_WithAllProvidedFields()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var actor = "user:abc123";
            var errorMessage = "Something went wrong";

            AuditLog? captured = null;
            await _auditLogRepository.AddAsync(
                Arg.Do<AuditLog>(a => captured = a),
                Arg.Any<CancellationToken>());

            // Act
            await _sut.LogAsync(
                correlationId,
                AuditEventType.JobFailed,
                service: "aspnet-api",
                actor: actor,
                payload: new { reason = "timeout" },
                isSuccess: false,
                errorMessage: errorMessage,
                ct: TestContext.Current.CancellationToken);

            // Assert
            captured.Should().NotBeNull();
            captured!.CorrelationId.Should().Be(correlationId);
            captured.EventType.Should().Be(AuditEventType.JobFailed);
            captured.Service.Should().Be("aspnet-api");
            captured.Actor.Should().Be(actor);
            captured.IsSuccess.Should().BeFalse();
            captured.ErrorMessage.Should().Be(errorMessage);
        }

        [Fact]
        public async Task LogAsync_ShouldSerializePayloadToJson_WhenPayloadProvided()
        {
            // Arrange
            AuditLog? captured = null;
            await _auditLogRepository.AddAsync(
                Arg.Do<AuditLog>(a => captured = a),
                Arg.Any<CancellationToken>());

            var payload = new { fileName = "receipt.jpg", fileSizeBytes = 1024 };

            // Act
            await _sut.LogAsync(
                Guid.NewGuid(),
                AuditEventType.ReceiptUploaded,
                service: "aspnet-api",
                payload: payload,
                ct: TestContext.Current.CancellationToken);

            // Assert
            captured.Should().NotBeNull();
            captured!.Payload.Should().NotBeNull();

            var deserialized = JsonSerializer.Deserialize<Dictionary<string, object>>(captured.Payload!);
            deserialized.Should().ContainKey("fileName");
            deserialized!["fileName"].ToString().Should().Be("receipt.jpg");
        }

        [Fact]
        public async Task LogAsync_ShouldSetPayloadToNull_WhenNoPayloadProvided()
        {
            // Arrange
            AuditLog? captured = null;
            await _auditLogRepository.AddAsync(
                Arg.Do<AuditLog>(a => captured = a),
                Arg.Any<CancellationToken>());

            // Act
            await _sut.LogAsync(
                Guid.NewGuid(),
                AuditEventType.ResultRetrieved,
                service: "aspnet-api",
                ct: TestContext.Current.CancellationToken);

            // Assert
            captured.Should().NotBeNull();
            captured!.Payload.Should().BeNull();
        }

        [Fact]
        public async Task LogAsync_ShouldDefaultIsSuccessToTrue_WhenNotSpecified()
        {
            // Arrange
            AuditLog? captured = null;
            await _auditLogRepository.AddAsync(
                Arg.Do<AuditLog>(a => captured = a),
                Arg.Any<CancellationToken>());

            // Act
            await _sut.LogAsync(
                Guid.NewGuid(),
                AuditEventType.JobCompleted,
                service: "aspnet-api",
                ct: TestContext.Current.CancellationToken);

            // Assert
            captured.Should().NotBeNull();
            captured!.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task LogAsync_ShouldDefaultActorAndErrorMessageToNull_WhenNotSpecified()
        {
            // Arrange
            AuditLog? captured = null;
            await _auditLogRepository.AddAsync(
                Arg.Do<AuditLog>(a => captured = a),
                Arg.Any<CancellationToken>());

            // Act
            await _sut.LogAsync(
                Guid.NewGuid(),
                AuditEventType.LlmRequestSent,
                service: "azure-function",
                ct: TestContext.Current.CancellationToken);

            // Assert
            captured.Should().NotBeNull();
            captured!.Actor.Should().BeNull();
            captured.ErrorMessage.Should().BeNull();
        }

        // ── GetTrailAsync ─────────────────────────────────────

        [Fact]
        public async Task GetTrailAsync_ShouldReturnAuditLogs_ForGivenCorrelationId()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var logs = new List<AuditLog>
        {
            new() { CorrelationId = correlationId, EventType = AuditEventType.ReceiptUploaded },
            new() { CorrelationId = correlationId, EventType = AuditEventType.JobCreated }
        };

            _auditLogRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(logs);

            // Act
            var result = await _sut.GetTrailAsync(correlationId, TestContext.Current.CancellationToken);

            // Assert
            result.Should().BeEquivalentTo(logs);
        }

        [Fact]
        public async Task GetTrailAsync_ShouldReturnEmptyCollection_WhenNoLogsExist()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            _auditLogRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(new List<AuditLog>());

            // Act
            var result = await _sut.GetTrailAsync(correlationId, TestContext.Current.CancellationToken);

            // Assert
            result.Should().BeEmpty();
        }
    }
}
