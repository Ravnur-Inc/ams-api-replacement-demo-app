using Azure.Identity;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

if (args.Length == 2)
{
    JobMonitor.Subject = $"transforms/{args[0]}/jobs/{args[1]}";
}

var builder = new HostBuilder();
        builder.UseEnvironment("development");
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config
                .AddJsonFile("appsettings.json", optional: true)
                .AddEnvironmentVariables();
        });
        builder.ConfigureLogging((context, logging) =>
        {
            logging.AddSimpleConsole(options =>
                {
                    options.IncludeScopes = true;
                    options.SingleLine = true;
                    options.TimestampFormat = "[HH:mm:ss] ";
                    options.ColorBehavior = Microsoft.Extensions.Logging.Console.LoggerColorBehavior.Enabled;
                });

            logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Warning);
        });
        builder.ConfigureWebJobs(b =>
        {
            b.AddAzureStorageCoreServices();
            b.AddAzureStorageQueues();
        });
        builder.ConfigureServices((context, services) =>
        {
            services.AddSingleton<INameResolver, EnvironmentVariablesNameResolver>();
            services.AddSingleton(implementationFactory: provider => new DefaultAzureCredential(provider.GetRequiredService<IOptions<DefaultAzureCredentialOptions>>().Value));
        });

using var host = builder.Build();
host.Start();
Console.WriteLine("Press any key to exit");
Console.Read();
host.StopAsync().Wait();

public class EnvironmentVariablesNameResolver : INameResolver
{
    public string Resolve(string name)
    {
        return Environment.GetEnvironmentVariable(name) ?? throw new InvalidOperationException($"Could not find environment variable with name '{name}'");
    }
}