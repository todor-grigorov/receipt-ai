using FluentAssertions;
using System.Net;

namespace ReceiptAI.IntegrationTests.Tests
{
    public class SmokeTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public SmokeTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetJobs_ShouldReturnOk_WhenAuthenticatedAsDefaultTestUser()
        {
            // Act
            var response = await _client.GetAsync("/api/jobs", TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task GetJobs_ShouldReturnEmptyPagedResponse_WhenNoJobsExistForUser()
        {
            // Act
            var response = await _client.GetAsync("/api/jobs", TestContext.Current.CancellationToken);
            var content = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            content.Should().Contain("\"items\":[]");
        }
    }
}
