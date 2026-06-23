using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using ReceiptAI.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
namespace ReceiptAI.IntegrationTests
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("receiptai_test")
            .WithUsername("testuser")
            .WithPassword("testpassword")
            .Build();

        public TestAuthContext AuthContext { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var dbContextDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

                if (dbContextDescriptor is not null)
                    services.Remove(dbContextDescriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseNpgsql(_dbContainer.GetConnectionString())
                        .ConfigureWarnings(warnings =>
                            warnings.Ignore(RelationalEventId.PendingModelChangesWarning)));

                services.AddSingleton(AuthContext);

                services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                        TestAuthHandler.SchemeName, options => { });
            });
        }

        async ValueTask IAsyncLifetime.InitializeAsync()
        {
            await _dbContainer.StartAsync();

            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await context.Database.MigrateAsync();
        }

        public new async ValueTask DisposeAsync()
        {
            await _dbContainer.DisposeAsync();
            await base.DisposeAsync();
        }
    }
}
