using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using ReceiptAI.Api.Services;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Application.Services;
using ReceiptAI.Infrastructure.Persistence;
using ReceiptAI.Infrastructure.Persistence.Repositories;
using ReceiptAI.Infrastructure.Services;

namespace ReceiptAI.Api.Extensions
{
    public static class ServiceExtensions
    {
        public static void ConfigureCors(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy",
                    builder => builder
                        .WithOrigins("http://localhost:3000")  // ← exact origin
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()                     // ← required for SignalR
                        .WithExposedHeaders("X-Pagination"));
            });
        }

        public static void ConfigureSqlContext(this IServiceCollection services, IConfiguration configuration) =>
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(configuration.GetConnectionString("postgresConnection")));

        public static void ConfigureRepositories(this IServiceCollection services)
        {
            services.AddScoped<IRepositoryManager, RepositoryManager>();
        }

        public static void ConfigureServices(this IServiceCollection services)
        {
            services.AddScoped<IJobService, JobService>();
            services.AddScoped<IReceiptService, ReceiptService>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IBlobService, BlobService>();
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
        }

        public static void ConfigureSwagger(this IServiceCollection services)
        {
            services.AddOpenApi(options =>
            {
                options.AddDocumentTransformer((document, context, ct) =>
                {
                    document.Info = new()
                    {
                        Title = "ReceiptAI API",
                        Version = "v1",
                        Description = "Async receipt processing with Gemini 2.5 Flash"
                    };
                    return Task.CompletedTask;
                });
            });
        }

        public static void ConfigureAuth(
            this IServiceCollection services,
            IConfiguration configuration) =>
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(configuration.GetSection("AzureAd"));

        public static void ConfigureBlobStorage(
            this IServiceCollection services,
            IConfiguration configuration) =>
            services.AddSingleton(new BlobServiceClient(
                configuration.GetConnectionString("AzureBlobStorage")
                ?? "UseDevelopmentStorage=true"));

        public static void ConfigureSignalR(this IServiceCollection services) =>
            services.AddSignalR();
    }
}
