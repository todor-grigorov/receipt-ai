using ReceiptAI.Api.Extensions;
using ReceiptAI.Api.Hubs;
using ReceiptAI.Api.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.ConfigureCors();
builder.Services.ConfigureSqlContext(builder.Configuration);
builder.Services.ConfigureRepositories();
builder.Services.ConfigureServices();
builder.Services.ConfigureSwagger();
builder.Services.ConfigureAuth(builder.Configuration);
builder.Services.ConfigureBlobStorage(builder.Configuration);
builder.Services.ConfigureSignalR();

builder.Services.AddAutoMapper(cfg => { }, typeof(Program));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter());
        });
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
app.UseMiddleware<ApiKeyMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("CorsPolicy");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<JobHub>("/hubs/jobs");

app.Run();

public partial class Program { }