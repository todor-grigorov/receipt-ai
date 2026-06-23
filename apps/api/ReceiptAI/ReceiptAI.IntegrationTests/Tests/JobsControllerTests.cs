using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Infrastructure.Persistence;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReceiptAI.IntegrationTests.Tests
{
    public class JobsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        private readonly HttpClient _client;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonStringEnumConverter() }
        };

        public JobsControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        private async Task<Job> SeedJobAsync(
            string userId,
            JobStatus status = JobStatus.Pending,
            CancellationToken ct = default)
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var job = new Job
            {
                CorrelationId = Guid.NewGuid(),
                UserId = userId,
                BlobUrl = "https://storage/test.jpg",
                Status = status
            };

            context.Jobs.Add(job);
            await context.SaveChangesAsync(ct);

            return job;
        }

        [Fact]
        public async Task GetById_ShouldReturnJob_WhenJobExists()
        {
            var job = await SeedJobAsync(_factory.AuthContext.CurrentUserId, ct: TestContext.Current.CancellationToken);

            var response = await _client.GetAsync(
                $"/api/jobs/{job.Id}", TestContext.Current.CancellationToken);

            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<JobStatusResponse>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Id.Should().Be(job.Id);
            result.CorrelationId.Should().Be(job.CorrelationId);
            result.Status.Should().Be(JobStatus.Pending);
        }

        [Fact]
        public async Task GetById_ShouldReturnNotFound_WhenJobDoesNotExist()
        {
            // Act
            var response = await _client.GetAsync(
                $"/api/jobs/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetAll_ShouldReturnOnlyJobsBelongingToCurrentUser()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            _factory.AuthContext.CurrentUserId = userId;

            var ownJob = await SeedJobAsync(userId, ct: TestContext.Current.CancellationToken);
            var otherUsersJob = await SeedJobAsync($"other-{Guid.NewGuid()}", ct: TestContext.Current.CancellationToken);

            // Act
            var response = await _client.GetAsync("/api/jobs", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var result = await response.Content.ReadFromJsonAsync<PagedResponse<JobStatusResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Items.Should().Contain(j => j.Id == ownJob.Id);
            result.Items.Should().NotContain(j => j.Id == otherUsersJob.Id);
        }

        [Fact]
        public async Task GetAll_ShouldFilterByStatus_WhenStatusQueryParamProvided()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            _factory.AuthContext.CurrentUserId = userId;

            var completedJob = await SeedJobAsync(userId, JobStatus.Completed, TestContext.Current.CancellationToken);
            var pendingJob = await SeedJobAsync(userId, JobStatus.Pending, TestContext.Current.CancellationToken);

            // Act
            var response = await _client.GetAsync(
                "/api/jobs?status=Completed", TestContext.Current.CancellationToken);

            // Assert
            var result = await response.Content.ReadFromJsonAsync<PagedResponse<JobStatusResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Items.Should().Contain(j => j.Id == completedJob.Id);
            result.Items.Should().NotContain(j => j.Id == pendingJob.Id);
        }

        [Fact]
        public async Task GetAll_ShouldRespectPageSize()
        {
            // Arrange
            var userId = $"user-{Guid.NewGuid()}";
            _factory.AuthContext.CurrentUserId = userId;

            for (var i = 0; i < 5; i++)
            {
                await SeedJobAsync(userId, ct: TestContext.Current.CancellationToken);
            }

            // Act
            var response = await _client.GetAsync(
                "/api/jobs?page=1&pageSize=2", TestContext.Current.CancellationToken);

            // Assert
            var result = await response.Content.ReadFromJsonAsync<PagedResponse<JobStatusResponse>>(
                JsonOptions, TestContext.Current.CancellationToken);

            result!.Items.Should().HaveCount(2);
            result.TotalCount.Should().Be(5);
            result.TotalPages.Should().Be(3);
        }

        [Fact]
        public async Task GetAll_ShouldReturnEmptyItems_WhenUserHasNoJobs()
        {
            // Arrange
            _factory.AuthContext.CurrentUserId = $"user-with-no-jobs-{Guid.NewGuid()}";

            // Act
            var response = await _client.GetAsync("/api/jobs", TestContext.Current.CancellationToken);

            // Assert
            var result = await response.Content.ReadFromJsonAsync<PagedResponse<JobStatusResponse>>(
                cancellationToken: TestContext.Current.CancellationToken);

            result!.Items.Should().BeEmpty();
            result.TotalCount.Should().Be(0);
        }
    }
}
