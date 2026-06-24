using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Json;

namespace ReceiptAI.IntegrationTests.Tests
{
    public class AuditControllerTests(CustomWebApplicationFactory factory)
    : IntegrationTestBase(factory)
    {
        private async Task SeedAuditLogAsync(
            Guid correlationId,
            AuditEventType eventType,
            string service,
            bool isSuccess = true,
            CancellationToken ct = default)
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var log = new AuditLog
            {
                CorrelationId = correlationId,
                EventType = eventType,
                Service = service,
                IsSuccess = isSuccess
            };

            context.AuditLogs.Add(log);
            await context.SaveChangesAsync(ct);
        }

        [Fact]
        public async Task GetAuditTrail_ShouldReturnAllEvents_ForGivenCorrelationId()
        {
            // Arrange
            var correlationId = Guid.NewGuid();

            await SeedAuditLogAsync(
                correlationId, AuditEventType.ReceiptUploaded, "aspnet-api",
                ct: TestContext.Current.CancellationToken);
            await SeedAuditLogAsync(
                correlationId, AuditEventType.JobCreated, "aspnet-api",
                ct: TestContext.Current.CancellationToken);
            await SeedAuditLogAsync(
                correlationId, AuditEventType.JobCompleted, "aspnet-api",
                ct: TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{correlationId}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result.Should().HaveCount(3);
            result!.Select(r => r.EventType).Should().Contain([
                AuditEventType.ReceiptUploaded,
            AuditEventType.JobCreated,
            AuditEventType.JobCompleted
            ]);
        }

        [Fact]
        public async Task GetAuditTrail_ShouldReturnEventsInChronologicalOrder()
        {
            // Arrange
            var correlationId = Guid.NewGuid();

            await SeedAuditLogAsync(
                correlationId, AuditEventType.ReceiptUploaded, "aspnet-api",
                ct: TestContext.Current.CancellationToken);
            await Task.Delay(10, TestContext.Current.CancellationToken); // ensure distinct timestamps
            await SeedAuditLogAsync(
                correlationId, AuditEventType.JobCreated, "aspnet-api",
                ct: TestContext.Current.CancellationToken);
            await Task.Delay(10, TestContext.Current.CancellationToken);
            await SeedAuditLogAsync(
                correlationId, AuditEventType.JobCompleted, "aspnet-api",
                ct: TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{correlationId}", TestContext.Current.CancellationToken);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            // Assert
            result!.Select(r => r.EventType).Should().Equal(
                AuditEventType.ReceiptUploaded,
                AuditEventType.JobCreated,
                AuditEventType.JobCompleted
            );
        }

        [Fact]
        public async Task GetAuditTrail_ShouldReturnEmptyList_WhenNoEventsExistForCorrelationId()
        {
            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task GetAuditTrail_ShouldIncludeServiceNameAndSuccessFlag()
        {
            // Arrange
            var correlationId = Guid.NewGuid();

            await SeedAuditLogAsync(
                correlationId, AuditEventType.LlmRequestSent, "azure-function",
                ct: TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{correlationId}", TestContext.Current.CancellationToken);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            // Assert
            result!.Single().Service.Should().Be("azure-function");
            result.Single().IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task GetAuditTrail_ShouldIncludeFailedEventsWithErrorMessage()
        {
            // Arrange
            var correlationId = Guid.NewGuid();

            using (var scope = Factory.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                context.AuditLogs.Add(new AuditLog
                {
                    CorrelationId = correlationId,
                    EventType = AuditEventType.JobFailed,
                    Service = "aspnet-api",
                    IsSuccess = false,
                    ErrorMessage = "Gemini timed out"
                });
                await context.SaveChangesAsync(TestContext.Current.CancellationToken);
            }

            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{correlationId}", TestContext.Current.CancellationToken);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            // Assert
            result!.Single().IsSuccess.Should().BeFalse();
            result.Single().ErrorMessage.Should().Be("Gemini timed out");
        }

        [Fact]
        public async Task GetAuditTrail_ShouldBeAccessibleRegardlessOfWhichUserIsAuthenticated()
        {
            // This documents current behavior: the audit endpoint has no 
            // ownership check, unlike receipts. Any authenticated user can 
            // view any correlationId's audit trail.

            // Arrange
            var correlationId = Guid.NewGuid();
            await SeedAuditLogAsync(
                correlationId, AuditEventType.ReceiptUploaded, "aspnet-api",
                ct: TestContext.Current.CancellationToken);

            Factory.AuthContext.CurrentUserId = $"some-other-user-{Guid.NewGuid()}";

            // Act
            var response = await Client.GetAsync(
                $"/api/audit/{correlationId}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<List<AuditLogResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result.Should().HaveCount(1);
        }
    }
}
