using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Json;

namespace ReceiptAI.IntegrationTests.Tests
{
    public class ReceiptsControllerTests(CustomWebApplicationFactory factory)
    : IntegrationTestBase(factory)
    {
        private static HttpContent CreateFileUploadContent(
            string fileName = "receipt.jpg",
            string contentType = "image/jpeg",
            byte[]? fileBytes = null)
        {
            var content = new MultipartFormDataContent();
            var bytes = fileBytes ?? [0x01, 0x02, 0x03];
            var fileContent = new ByteArrayContent(bytes);
            fileContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            content.Add(fileContent, "file", fileName);
            return content;
        }

        private async Task<Receipt> SeedReceiptAsync(
            string userId,
            CancellationToken ct = default)
        {
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var correlationId = Guid.NewGuid();

            var job = new Job
            {
                CorrelationId = correlationId,
                UserId = userId,
                BlobUrl = "https://fake-storage.test/receipts/test.jpg",
                Status = JobStatus.Completed
            };
            context.Jobs.Add(job);

            var receipt = new Receipt
            {
                CorrelationId = correlationId,
                UserId = userId,
                OriginalFileName = "receipt.jpg",
                MerchantName = "Coop",
                Total = 10.5m,
                Currency = "CHF"
            };
            context.Receipts.Add(receipt);

            await context.SaveChangesAsync(ct);

            return receipt;
        }

        [Fact]
        public async Task Upload_ShouldReturnAccepted_WhenFileIsValid()
        {
            // Arrange
            var content = CreateFileUploadContent();

            // Act
            var response = await Client.PostAsync(
                "/api/receipts/upload", content, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Accepted);

            var result = await response.Content.ReadFromJsonAsync<ReceiptResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.BlobUrl.Should().NotBeNullOrEmpty();
            result.CorrelationId.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public async Task Upload_ShouldCreateJobRecord_InDatabase()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            Factory.AuthContext.CurrentUserId = userId;
            var content = CreateFileUploadContent();

            // Act
            var response = await Client.PostAsync(
                "/api/receipts/upload", content, TestContext.Current.CancellationToken);

            var result = await response.Content.ReadFromJsonAsync<ReceiptResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            // Assert
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var job = await context.Jobs.FirstOrDefaultAsync(
                j => j.CorrelationId == result!.CorrelationId,
                TestContext.Current.CancellationToken);

            job.Should().NotBeNull();
            job!.UserId.Should().Be(userId);
            job.Status.Should().Be(JobStatus.Pending);
        }

        [Fact]
        public async Task Upload_ShouldWriteReceiptUploadedAndBlobStoredAuditEvents()
        {
            // Arrange
            var content = CreateFileUploadContent();

            // Act
            var response = await Client.PostAsync(
                "/api/receipts/upload", content, TestContext.Current.CancellationToken);

            var result = await response.Content.ReadFromJsonAsync<ReceiptResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            // Assert
            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var auditLogs = await context.AuditLogs
                .Where(a => a.CorrelationId == result!.CorrelationId)
                .ToListAsync(TestContext.Current.CancellationToken);

            auditLogs.Should().Contain(a => a.EventType == AuditEventType.ReceiptUploaded);
            auditLogs.Should().Contain(a => a.EventType == AuditEventType.BlobStored);
        }

        [Fact]
        public async Task Upload_ShouldReturnBadRequest_WhenNoFileProvided()
        {
            // Arrange
            var content = new MultipartFormDataContent();

            // Act
            var response = await Client.PostAsync(
                "/api/receipts/upload", content, TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetById_ShouldReturnReceipt_WhenOwnedByCurrentUser()
        {
            // Arrange
            var receipt = await SeedReceiptAsync(
                Factory.AuthContext.CurrentUserId, TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync(
                $"/api/receipts/{receipt.Id}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<ReceiptResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Id.Should().Be(receipt.Id);
            result.MerchantName.Should().Be("Coop");
        }

        [Fact]
        public async Task GetById_ShouldReturnForbidden_WhenReceiptBelongsToAnotherUser()
        {
            // Arrange
            var ownerUserId = $"owner-{Guid.NewGuid()}";
            var receipt = await SeedReceiptAsync(ownerUserId, TestContext.Current.CancellationToken);

            Factory.AuthContext.CurrentUserId = $"different-user-{Guid.NewGuid()}";

            // Act
            var response = await Client.GetAsync(
                $"/api/receipts/{receipt.Id}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenReceiptDoesNotExist()
        {
            // Act
            var response = await Client.GetAsync(
                $"/api/receipts/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetByCorrelationId_ShouldReturnReceipt_WhenOwnedByCurrentUser()
        {
            // Arrange
            var receipt = await SeedReceiptAsync(
                Factory.AuthContext.CurrentUserId, TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync(
                $"/api/receipts/correlation/{receipt.CorrelationId}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<ReceiptResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.CorrelationId.Should().Be(receipt.CorrelationId);
        }

        [Fact]
        public async Task GetAll_ShouldReturnOnlyReceiptsBelongingToCurrentUser()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            Factory.AuthContext.CurrentUserId = userId;

            var ownReceipt = await SeedReceiptAsync(userId, TestContext.Current.CancellationToken);
            var otherUsersReceipt = await SeedReceiptAsync(
                $"other-{Guid.NewGuid()}", TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync("/api/receipts", TestContext.Current.CancellationToken);

            // Assert
            var result = await response.Content.ReadFromJsonAsync<PagedResponse<ReceiptResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Items.Should().Contain(r => r.Id == ownReceipt.Id);
            result.Items.Should().NotContain(r => r.Id == otherUsersReceipt.Id);
        }

        [Fact]
        public async Task GetAll_ShouldIncludeXPaginationHeader()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            Factory.AuthContext.CurrentUserId = userId;
            await SeedReceiptAsync(userId, TestContext.Current.CancellationToken);

            // Act
            var response = await Client.GetAsync("/api/receipts", TestContext.Current.CancellationToken);

            // Assert
            response.Headers.Should().ContainKey("X-Pagination");
        }

        [Fact]
        public async Task Delete_ShouldRemoveReceipt_WhenOwnedByCurrentUser()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            Factory.AuthContext.CurrentUserId = userId;
            var receipt = await SeedReceiptAsync(userId, TestContext.Current.CancellationToken);

            // Act
            var response = await Client.DeleteAsync(
                $"/api/receipts/{receipt.Id}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var deletedReceipt = await context.Receipts.FindAsync(
                [receipt.Id], TestContext.Current.CancellationToken);

            deletedReceipt.Should().BeNull();
        }

        [Fact]
        public async Task Delete_ShouldReturnForbidden_WhenReceiptBelongsToAnotherUser()
        {
            // Arrange
            var ownerUserId = $"owner-{Guid.NewGuid()}";
            var receipt = await SeedReceiptAsync(ownerUserId, TestContext.Current.CancellationToken);

            Factory.AuthContext.CurrentUserId = $"different-user-{Guid.NewGuid()}";

            // Act
            var response = await Client.DeleteAsync(
                $"/api/receipts/{receipt.Id}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

            using var scope = Factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stillExists = await context.Receipts.FindAsync(
                [receipt.Id], TestContext.Current.CancellationToken);

            stillExists.Should().NotBeNull();
        }

        [Fact]
        public async Task Delete_ShouldReturnNotFound_WhenReceiptDoesNotExist()
        {
            // Act
            var response = await Client.DeleteAsync(
                $"/api/receipts/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }
}
