using Microsoft.Extensions.Configuration;
using rms_live_demo_app;

try
{
    string inputFile = args.Length > 1 ? args[1] : "InputFiles/Castilian.mp4";

    var builder = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false)
        .AddUserSecrets<Program>()
        .AddEnvironmentVariables();

    IConfiguration config = builder.Build();

    var rmsOptions = config.GetSection("Ravnur").Get<RmsOptions>();

    if (rmsOptions is null)
    {
        Console.WriteLine("Ravnur section is missing from appsettings.json");
        return;
    }

    Console.WriteLine($"Starting demo Live session with {inputFile} as stream source");

    var vodProvider = new LiveRunner(rmsOptions);
    await vodProvider.RunLive(inputFile);
}
catch (Exception ex)
{
    Console.WriteLine(ex.Message);
}

Console.WriteLine("Press any key to exit...");
Console.ReadKey();