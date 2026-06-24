using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Json;

namespace ReceiptAI.IntegrationTests.Tests
{
    public class NotificationsControllerTests(CustomWebApplicationFactory factory)
    : IntegrationTestBase(factory)
    {
        private async Task<Job> SeedJobAsync(CancellationToken ct = default)
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var job = new Job
            {
                CorrelationId = Guid.NewGuid(),
                UserId = "some-user",
                BlobUrl = "https://storage/test.jpg",
                Status = JobStatus.Pending
            };

            context.Jobs.Add(job);
            await context.SaveChangesAsync(ct);

            return job;
        }

        private HttpRequestMessage CreateRequest(
            Guid correlationId, NotifyJobRequest body, string? apiKey)
        {
            var request = new HttpRequestMessage(
                HttpMethod.Post, $"/api/internal/notifications/jobs/{correlationId}")
            {
                Content = JsonContent.Create(body, options: JsonOptions)
            };

            if (apiKey is not null)
                request.Headers.Add("X-Api-Key", apiKey);

            return request;
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldReturnUnauthorized_WhenApiKeyHeaderIsMissing()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Processing, null, null);
            var request = CreateRequest(job.CorrelationId, body, apiKey: null);

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldReturnForbidden_WhenApiKeyIsIncorrect()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Processing, null, null);
            var request = CreateRequest(job.CorrelationId, body, apiKey: "wrong-key");

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldUpdateStatusToProcessing_WhenApiKeyIsValid()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Processing, null, null);
            var request = CreateRequest(job.CorrelationId, body, CustomWebApplicationFactory.TestApiKey);

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updatedJob = await context.Jobs.FindAsync([job.Id], TestContext.Current.CancellationToken);

            updatedJob!.Status.Should().Be(JobStatus.Processing);
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldUpdateStatusToCompleted_AndStoreNoErrorMessage()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var resultId = Guid.NewGuid();
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Completed, resultId, null);
            var request = CreateRequest(job.CorrelationId, body, CustomWebApplicationFactory.TestApiKey);

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updatedJob = await context.Jobs.FindAsync([job.Id], TestContext.Current.CancellationToken);

            updatedJob!.Status.Should().Be(JobStatus.Completed);
            updatedJob.ErrorMessage.Should().BeNull();
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldUpdateStatusToFailed_AndStoreErrorMessage()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Failed, null, "Gemini timed out");
            var request = CreateRequest(job.CorrelationId, body, CustomWebApplicationFactory.TestApiKey);

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updatedJob = await context.Jobs.FindAsync([job.Id], TestContext.Current.CancellationToken);

            updatedJob!.Status.Should().Be(JobStatus.Failed);
            updatedJob.ErrorMessage.Should().Be("Gemini timed out");
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldWriteAuditLogEntry_ForEachStatusTransition()
        {
            // Arrange
            var job = await SeedJobAsync(TestContext.Current.CancellationToken);
            var body = new NotifyJobRequest(job.CorrelationId, JobStatus.Completed, Guid.NewGuid(), null);
            var request = CreateRequest(job.CorrelationId, body, CustomWebApplicationFactory.TestApiKey);

            // Act
            await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var auditLogs = await context.AuditLogs
                .Where(a => a.CorrelationId == job.CorrelationId)
                .ToListAsync(TestContext.Current.CancellationToken);

            auditLogs.Should().Contain(a => a.EventType == AuditEventType.JobCompleted);
        }

        [Fact]
        public async Task NotifyJobStatus_ShouldReturnNotFound_WhenJobDoesNotExist()
        {
            // Arrange
            var unknownCorrelationId = Guid.NewGuid();
            var body = new NotifyJobRequest(unknownCorrelationId, JobStatus.Processing, null, null);
            var request = CreateRequest(unknownCorrelationId, body, CustomWebApplicationFactory.TestApiKey);

            // Act
            var response = await Client.SendAsync(request, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }
}
