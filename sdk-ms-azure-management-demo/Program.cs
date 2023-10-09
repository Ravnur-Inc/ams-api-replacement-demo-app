using Microsoft.Extensions.Configuration;
using VodCreatorApp;
using VodCreatorApp.Configuration;

public partial class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            string platform = args.Length > 0 ? args[0].ToLower() : "rms";
            string inputFile = args.Length > 1 ? args[1] : "DefaultInput/ForBiggerBlazes.mp4";

            var builder = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddEnvironmentVariables();

            IConfiguration config = builder.Build();

            var azureOptions = config.GetSection("Azure").Get<AzureMediaServicesOptions>();
            var rmsOptions = config.GetSection("Ravnur").Get<RmsOptions>();

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
            await vodProvider.CreateVod(platform, inputFile);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }
        Console.WriteLine("Press any key to exit...");
        Console.ReadKey();
    }
}

