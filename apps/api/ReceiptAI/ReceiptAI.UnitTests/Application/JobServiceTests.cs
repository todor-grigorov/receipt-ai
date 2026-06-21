using AutoMapper;
using FluentAssertions;
using NSubstitute;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Application.Services;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Domain.Exceptions;

namespace ReceiptAI.UnitTests.Application
{
    public class JobServiceTests
    {
        private readonly IRepositoryManager _repository;
        private readonly IJobRepository _jobRepository;
        private readonly IAuditService _auditService;
        private readonly IMapper _mapper;
        private readonly JobService _sut; // System Under Test

        public JobServiceTests()
        {
            _repository = Substitute.For<IRepositoryManager>();
            _jobRepository = Substitute.For<IJobRepository>();
            _auditService = Substitute.For<IAuditService>();
            _mapper = Substitute.For<IMapper>();

            _repository.Job.Returns(_jobRepository);

            _sut = new JobService(_repository, _auditService, _mapper);
        }

        // ── GetByIdAsync ──────────────────────────────────────

        [Fact]
        public async Task GetByIdAsync_ShouldReturnMappedResponse_WhenJobExists()
        {
            // Arrange
            var jobId = Guid.NewGuid();
            var job = new Job { Id = jobId, CorrelationId = Guid.NewGuid() };
            var expectedResponse = new JobStatusResponse(
                jobId, job.CorrelationId, JobStatus.Pending, null, null,
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow);

            _jobRepository.GetByIdAsync(jobId, Arg.Any<CancellationToken>())
                .Returns(job);
            _mapper.Map<JobStatusResponse>(job).Returns(expectedResponse);

            // Act
            var result = await _sut.GetByIdAsync(jobId, ct: TestContext.Current.CancellationToken);

            // Assert
            result.Should().Be(expectedResponse);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowNotFoundException_WhenJobDoesNotExist()
        {
            // Arrange
            var jobId = Guid.NewGuid();
            _jobRepository.GetByIdAsync(jobId, Arg.Any<CancellationToken>())
                .Returns((Job?)null);

            // Act
            var act = async () => await _sut.GetByIdAsync(jobId);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"Job {jobId} not found");
        }

        // ── CreateAsync ───────────────────────────────────────

        [Fact]
        public async Task CreateAsync_ShouldCreateJobWithPendingStatus_AndLogJobCreatedEvent()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var userId = "user-123";
            var blobUrl = "https://storage/receipts/test.jpg";

            Job? capturedJob = null;
            await _jobRepository.AddAsync(
                Arg.Do<Job>(j => capturedJob = j),
                Arg.Any<CancellationToken>());

            _mapper.Map<JobStatusResponse>(Arg.Any<Job>())
                .Returns(new JobStatusResponse(
                    Guid.NewGuid(), correlationId, JobStatus.Pending, null, null,
                    DateTimeOffset.UtcNow, DateTimeOffset.UtcNow));

            // Act
            await _sut.CreateAsync(correlationId, userId, blobUrl, ct: TestContext.Current.CancellationToken);

            // Assert
            capturedJob.Should().NotBeNull();
            capturedJob!.CorrelationId.Should().Be(correlationId);
            capturedJob.UserId.Should().Be(userId);
            capturedJob.BlobUrl.Should().Be(blobUrl);
            capturedJob.Status.Should().Be(JobStatus.Pending);

            await _auditService.Received(1).LogAsync(
                correlationId,
                AuditEventType.JobCreated,
                service: Arg.Any<string>(),
                actor: $"user:{userId}",
                payload: Arg.Any<object>(),
                isSuccess: true,
                errorMessage: null,
                ct: Arg.Any<CancellationToken>());
        }

        // ── UpdateStatusAsync — the critical regression tests ──

        [Theory]
        [InlineData(JobStatus.Pending, AuditEventType.JobCreated)]
        [InlineData(JobStatus.Processing, AuditEventType.JobProcessingStarted)]
        [InlineData(JobStatus.Completed, AuditEventType.JobCompleted)]
        [InlineData(JobStatus.Failed, AuditEventType.JobFailed)]
        public async Task UpdateStatusAsync_ShouldLogCorrectAuditEventType_PerJobStatus(
            JobStatus status, AuditEventType expectedEventType)
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var job = new Job { CorrelationId = correlationId, Status = JobStatus.Pending };

            _jobRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(job);

            _mapper.Map<JobStatusResponse>(Arg.Any<Job>())
                .Returns(new JobStatusResponse(
                    Guid.NewGuid(), correlationId, status, null, null,
                    DateTimeOffset.UtcNow, DateTimeOffset.UtcNow));

            // Act
            await _sut.UpdateStatusAsync(correlationId, status, ct: TestContext.Current.CancellationToken);

            // Assert
            await _auditService.Received(1).LogAsync(
                correlationId,
                expectedEventType,
                service: Arg.Any<string>(),
                actor: Arg.Any<string?>(),
                payload: Arg.Any<object>(),
                isSuccess: status != JobStatus.Failed,
                errorMessage: Arg.Any<string?>(),
                ct: Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task UpdateStatusAsync_ShouldUpdateJobStatusAndErrorMessage()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            var job = new Job { CorrelationId = correlationId, Status = JobStatus.Processing };
            var errorMessage = "Gemini parsing failed";

            _jobRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns(job);

            _mapper.Map<JobStatusResponse>(Arg.Any<Job>())
                .Returns(new JobStatusResponse(
                    Guid.NewGuid(), correlationId, JobStatus.Failed, errorMessage, null,
                    DateTimeOffset.UtcNow, DateTimeOffset.UtcNow));

            // Act
            await _sut.UpdateStatusAsync(correlationId, JobStatus.Failed, errorMessage, ct: TestContext.Current.CancellationToken);

            // Assert
            job.Status.Should().Be(JobStatus.Failed);
            job.ErrorMessage.Should().Be(errorMessage);

            await _jobRepository.Received(1).UpdateAsync(job, Arg.Any<CancellationToken>());
        }

        [Fact]
        public async Task UpdateStatusAsync_ShouldThrowNotFoundException_WhenJobDoesNotExist()
        {
            // Arrange
            var correlationId = Guid.NewGuid();
            _jobRepository.GetByCorrelationIdAsync(correlationId, Arg.Any<CancellationToken>())
                .Returns((Job?)null);

            // Act
            var act = async () => await _sut.UpdateStatusAsync(correlationId, JobStatus.Completed);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"Job with correlationId {correlationId} not found");
        }

        // ── CountByUserIdAsync ────────────────────────────────

        [Fact]
        public async Task CountByUserIdAsync_ShouldReturnCountFromRepository()
        {
            // Arrange
            var userId = "user-123";
            _jobRepository.CountByUserIdAsync(userId, null, Arg.Any<CancellationToken>())
                .Returns(5);

            // Act
            var result = await _sut.CountByUserIdAsync(userId, ct: TestContext.Current.CancellationToken);

            // Assert
            result.Should().Be(5);
        }
    }
}
