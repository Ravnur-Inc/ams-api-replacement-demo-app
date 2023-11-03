using Microsoft.Azure.Management.Media.Models;
using Microsoft.Extensions.Configuration;
using VodCreatorApp;
using VodCreatorApp.Configuration;

public partial class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            string[] positionArgs = args.Where(args => !args.StartsWith("/")).ToArray();
            string platform = positionArgs.Length > 0 ? positionArgs[0].ToLower() : "rms";
            string inputFile = positionArgs.Length > 1 ? positionArgs[1] : "Input/ForBiggerBlazes.mp4";

            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddUserSecrets<Program>()
                .AddEnvironmentVariables()
                .AddCommandLine(args);

            IConfiguration config = builder.Build();

            var azureOptions = config.GetSection("Azure").Get<AzureMediaServicesOptions>();
            var rmsOptions = config.GetSection("Ravnur").Get<RmsOptions>();
            var transformOptions = config.GetSection("Transform").Get<TransformOptions>() ?? new TransformOptions();

            if (rmsOptions is null)
            {
                Console.WriteLine("Ravnur section is missing from appsettings.json");
                return;
            }

            if (azureOptions is null && platform == "azure")
            {
                Console.WriteLine("Azure section is missing from appsettings.json");
                return;
            }

            Console.WriteLine($"Creating VOD from {inputFile} for {platform} platform");

            //var vodProvider = new VodProvider(rmsOptions, azureOptions);
            var vodProvider = new VodProvider(rmsOptions, azureOptions);
            await vodProvider.CreateVod(platform, inputFile, transformOptions);
        }
        catch (ErrorResponseException ex)
        {
            Console.WriteLine(ex.Body?.Error?.Message ?? "RMS API error");
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }
        Console.WriteLine("Press any key to exit...");
        Console.ReadKey();
    }
}

