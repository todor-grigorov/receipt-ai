using FluentAssertions;
using NetArchTest.Rules;

namespace ReceiptAI.UnitTests.Architecture
{
    public class ArchitectureTests
    {
        private const string DomainNamespace = "ReceiptAI.Domain";
        private const string ApplicationNamespace = "ReceiptAI.Application";
        private const string InfrastructureNamespace = "ReceiptAI.Infrastructure";
        private const string ApiNamespace = "ReceiptAI.Api";

        [Fact]
        public void Domain_ShouldNotDependOn_AnyOtherLayer()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Domain.Entities.Job).Assembly)
                .Should()
                .NotHaveDependencyOnAny(
                    ApplicationNamespace, InfrastructureNamespace, ApiNamespace)
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        [Fact]
        public void Application_ShouldNotDependOn_InfrastructureOrApi()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Application.Services.JobService).Assembly)
                .Should()
                .NotHaveDependencyOnAny(InfrastructureNamespace, ApiNamespace)
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        [Fact]
        public void Infrastructure_ShouldNotDependOn_Api()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Infrastructure.Persistence.AppDbContext).Assembly)
                .Should()
                .NotHaveDependencyOn(ApiNamespace)
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        [Fact]
        public void RepositoryImplementations_ShouldOnlyExistIn_Infrastructure()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Application.Services.JobService).Assembly)
                .That()
                .ImplementInterface(typeof(ReceiptAI.Application.Interfaces.Repositories.IJobRepository))
                .Should()
                .ResideInNamespace(InfrastructureNamespace)
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        [Fact]
        public void Controllers_ShouldOnlyExistIn_Api()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Api.Controllers.ReceiptsController).Assembly)
                .That()
                .Inherit(typeof(Microsoft.AspNetCore.Mvc.ControllerBase))
                .Should()
                .ResideInNamespace(ApiNamespace + ".Controllers")
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        [Fact]
        public void ServiceImplementations_ShouldOnlyExistIn_Application()
        {
            var result = Types.InAssembly(typeof(ReceiptAI.Application.Services.JobService).Assembly)
                .That()
                .ImplementInterface(typeof(ReceiptAI.Application.Interfaces.Services.IJobService))
                .Should()
                .ResideInNamespace(ApplicationNamespace + ".Services")
                .GetResult();

            result.IsSuccessful.Should().BeTrue(BuildFailureMessage(result));
        }

        private static string BuildFailureMessage(NetArchTest.Rules.TestResult result)
        {
            if (result.IsSuccessful) return string.Empty;

            var failingTypes = result.FailingTypes?
                .Select(t => t.FullName)
                ?? Enumerable.Empty<string>();

            return $"The following types violate the architecture rule:\n" +
                   string.Join("\n", failingTypes);
        }
    }
}
