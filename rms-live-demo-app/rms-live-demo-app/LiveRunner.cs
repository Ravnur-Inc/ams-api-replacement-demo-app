using Azure;
using Azure.Core;
using Azure.ResourceManager;
using Azure.ResourceManager.Media;
using Azure.ResourceManager.Media.Models;

using System.Diagnostics;
using System.Net;

namespace rms_live_demo_app
{
    internal class LiveRunner
    {
        private const string StreamingEndpointName = "default";
        private readonly RmsOptions _rmsOptions;

        public LiveRunner(RmsOptions rmsOptions)
        {
            _rmsOptions = rmsOptions;
        }

        public async Task RunLive(string inputFile)
        {
            // Creating a unique suffix for this test run
            string unique = Guid.NewGuid().ToString()[..13];

            // Create a new instance of the Media Services account
            MediaServicesAccountResource mediaService = CreateRmsClient();

            Console.WriteLine("Please select live output type:");
            Console.WriteLine("1. Passthrough");
            Console.WriteLine("2. Adaptive bitrate 720p");

            byte liveOutputType = 0;
            while (!byte.TryParse(Console.ReadLine(), out liveOutputType) ||
                    liveOutputType < 1 ||
                    liveOutputType > 2)
            {
                Console.WriteLine("Please select 1 or 2");
            }

            //Create Live Event
            var liveEvent = await GetOrCreateLiveEvent(mediaService, liveOutputType, $"liveevent-test-{liveOutputType}");

            // Create output Asset
            var outputAsset = await CreateAsset(mediaService, $"livearchive-{unique}");
            Console.WriteLine();
            Console.WriteLine($"Live archive Asset created: {outputAsset.Data.Name} (container {outputAsset.Data.Container})");

            // Create live Output
            var liveOutput = await CreateLiveOutput(liveEvent, outputAsset.Data.Name, $"liveoutput-{unique}");
            Console.WriteLine();
            Console.WriteLine($"Live Output '{liveOutput.Data.Name}' created");

            // Create Streaming Locator
            var streamingLocator = await CreateStreamingLocator(mediaService, outputAsset.Data.Name, $"locator-{unique}");
            Console.WriteLine();
            Console.WriteLine($"Streaming Locator '{streamingLocator.Data.Name}' created");

            // Start the Live Event
            Console.WriteLine();
            Console.WriteLine("Starting the Live Event, please wait...");
            await liveEvent.StartAsync(WaitUntil.Completed);

            Console.WriteLine();
            liveEvent = await mediaService.GetMediaLiveEventAsync(liveEvent.Data.Name);
            if (liveEvent.Data.ResourceState != LiveEventResourceState.Running)
            {
                Console.WriteLine($"Live Event '{liveEvent.Data.Name}' failed to start");
                return;
            }
            Console.WriteLine($"Live Event '{liveEvent.Data.Name}' is running");

            // Stream vido file to ingest endpoint using ffmpeg
            Console.WriteLine();
            Console.WriteLine($"Starting ffmpeg streaming of local file {inputFile}");
            StartFfmpegStreaming(inputFile, liveEvent);

            var paths = streamingLocator.GetStreamingPaths();
            string hlsPath = paths.Value.StreamingPaths.First(p => p.StreamingProtocol == StreamingPolicyStreamingProtocol.Hls).Paths[0];
            string dashPath = paths.Value.StreamingPaths.First(p => p.StreamingProtocol == StreamingPolicyStreamingProtocol.Dash).Paths[0];

            Console.WriteLine();
            Console.WriteLine($"HLS URL: {hlsPath}");
            Console.WriteLine($"DASH URL: {dashPath}");

            Console.WriteLine();
            Console.WriteLine("Press any key to stop the Live Event");
            Console.ReadKey();

            // Stop the Live Event
            Console.WriteLine();
            Console.WriteLine("Stopping the Live Event, please wait...");
            await liveEvent.StopAsync(WaitUntil.Completed, new LiveEventActionContent());
            
            Console.WriteLine();
            liveEvent = await mediaService.GetMediaLiveEventAsync(liveEvent.Data.Name);
            if (liveEvent.Data.ResourceState != LiveEventResourceState.Stopped)
            {
                Console.WriteLine($"Live Event '{liveEvent.Data.Name}' failed to stop");
                return;
            }
            Console.WriteLine($"Live Event '{liveEvent.Data.Name}' is stopped");

            // Get VOD streaming URLs
            paths = streamingLocator.GetStreamingPaths();
            hlsPath = paths.Value.StreamingPaths.First(p => p.StreamingProtocol == StreamingPolicyStreamingProtocol.Hls).Paths[0];
            dashPath = paths.Value.StreamingPaths.First(p => p.StreamingProtocol == StreamingPolicyStreamingProtocol.Dash).Paths[0];

            // Get VOD streaming endpoint
            var streamingEndpoint = (await mediaService.GetStreamingEndpoints().GetAsync(StreamingEndpointName)).Value;

            Console.WriteLine();
            Console.WriteLine($"Live Archive HLS URL: https://{streamingEndpoint.Data.HostName}{hlsPath}");
            Console.WriteLine($"Live Archive DASH URL: https://{streamingEndpoint.Data.HostName}{dashPath}");
        }

        private MediaServicesAccountResource CreateRmsClient()
        {
            ArmClient armClient = new ArmClient(
                new RmsApiKeyCredentials(
                    authorityUri: new Uri(_rmsOptions.ApiEndpoint),
                    subscriptionId: _rmsOptions.SubscriptionId ?? throw new Exception("Rms SubscriptionId is missing"),
                    apiKey: _rmsOptions.ApiKey),
                _rmsOptions.SubscriptionId,
                new ArmClientOptions
                {
                    Environment = new ArmEnvironment(new Uri(_rmsOptions.ApiEndpoint), "test"),
                });

            var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
                _rmsOptions.SubscriptionId,
                _rmsOptions.ResourceGroupName,
                _rmsOptions.MediaServicesAccountName);

            return armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier);
        }

        private static async Task<MediaLiveEventResource> GetOrCreateLiveEvent(
            MediaServicesAccountResource mediaService,
            byte liveOutputType,
            string liveEventName)
        {
            try
            {
                return (await mediaService.GetMediaLiveEventAsync(liveEventName)).Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                // Continue to create a new live event
            }

            var liveEventData = new MediaLiveEventData(AzureLocation.WestEurope)
            {
                UseStaticHostname = true,
                HostnamePrefix = liveEventName,
                Description = liveEventName,
                Encoding = new LiveEventEncoding()
                {
                     EncodingType = liveOutputType == 2 ? LiveEventEncodingType.Standard : LiveEventEncodingType.PassthroughStandard,
                     PresetName = liveOutputType == 2 ? "Default720p" : null,
                },
                Input = new LiveEventInput(LiveEventInputProtocol.Rtmp)
                {
                    KeyFrameIntervalDuration = TimeSpan.FromSeconds(2),
                },
                Preview = new LiveEventPreview(),
            };

            liveEventData.Input.IPAllowedIPs.Add(new IPRange { Name = "AllowAll", Address = IPAddress.Parse("0.0.0.0"), SubnetPrefixLength = 0 });
            liveEventData.Preview.IPAllowedIPs.Add(new IPRange { Name = "Allow All", Address = IPAddress.Parse("0.0.0.0"), SubnetPrefixLength = 0 });

            var liveEvent = await mediaService.GetMediaLiveEvents().CreateOrUpdateAsync(
                waitUntil: WaitUntil.Completed,
                liveEventName: liveEventName,
                data: liveEventData,
                autoStart: false);            

            return liveEvent.Value;
        }

        private static async Task<MediaAssetResource> CreateAsset(
            MediaServicesAccountResource mediaService,
            string assetName)
        {
            var asset = await mediaService.GetMediaAssets().CreateOrUpdateAsync(
                waitUntil: WaitUntil.Completed,
                assetName: assetName,
                data: new MediaAssetData());

            return asset.Value;
        }

        private static async Task<MediaLiveOutputResource> CreateLiveOutput(
            MediaLiveEventResource liveEvent,
            string assetName,
            string liveOutputName)
        {
            var liveOutput = await liveEvent.GetMediaLiveOutputs().CreateOrUpdateAsync(
                waitUntil: WaitUntil.Completed,
                liveOutputName: liveOutputName,
                data: new MediaLiveOutputData()
                {
                    AssetName = assetName,
                    ArchiveWindowLength = TimeSpan.FromHours(1),
                });

            return liveOutput.Value;
        }

        private static async Task<StreamingLocatorResource> CreateStreamingLocator(
            MediaServicesAccountResource mediaService,
            string assetName,
            string locatorName)
        {
            var locator = await mediaService.GetStreamingLocators().CreateOrUpdateAsync(
                WaitUntil.Completed,
                locatorName,
                new StreamingLocatorData
                {
                    AssetName = assetName,
                    StreamingPolicyName = "Predefined_DownloadAndClearStreaming",
                });

            return locator.Value;
        }

        private static void StartFfmpegStreaming(string inputFile, MediaLiveEventResource liveEvent)
        {
            Thread.Sleep(5000);

            // Get the Ingest URL and Access Token(Streaming Key) to use in streaming app
            string ingestUrl = liveEvent.Data.Input.Endpoints[0].Uri.AbsoluteUri;
            string accessToken = liveEvent.Data.Input.AccessToken;

            string ffmpegPath = Path.Combine(Directory.GetCurrentDirectory(), "ffmpeg/ffmpeg.exe");
            string inputFilePath = Path.Combine(Directory.GetCurrentDirectory(), inputFile);
            
            string ffmpegCommand = $"-re -i {inputFilePath} -c:v libx264 -s 1280x720  -pix_fmt yuv420p -r 30 -profile high -b:v 5000k -maxrate:v 5000k -bufsize 10000k " +
                $"-preset fast -tune zerolatency -g 60 -keyint_min 60 -c:a aac -b:a 128k -ar 44100 -ac 2 -f flv -flvflags no_duration_filesize {ingestUrl}/{accessToken}";

            Process p = new Process();
            p.StartInfo.CreateNoWindow = false;
            p.StartInfo.WindowStyle = ProcessWindowStyle.Normal;
            p.StartInfo.UseShellExecute = true;
            p.StartInfo.FileName = ffmpegPath;
            p.StartInfo.Arguments = ffmpegCommand;

            p.Start();
        }
    }
}
