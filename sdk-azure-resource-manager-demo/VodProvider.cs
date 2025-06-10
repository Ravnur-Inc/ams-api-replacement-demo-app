using System.Configuration;
using Azure;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Media;
using Azure.ResourceManager.Media.Models;
using Azure.Storage.Blobs;
using Jose;
using VodCreatorApp.Configuration;

namespace VodCreatorApp
{
    public class VodProvider
    {
        private const string TransformName = "RmsTestTransform22";
        private const string ContentKeyPolicyAes128Name = "RmsTestAes128ContentKeyPolicy";
        private const string StreamingEndpointName = "default";
        private const string LogoMaskLabel = "logoMask";
        private readonly AzureOptions? _azureOptions;
        private readonly RmsOptions _rmsOptions;

        public VodProvider(RmsOptions rmsOptions, AzureOptions? azureOptions)
        {
            _azureOptions = azureOptions;
            _rmsOptions = rmsOptions;
        }

        public async Task CreateVod(string mediaServicesType, string inputFile)
        {
            // Create a new instance of the Media Services account
            MediaServicesAccountResource mediaService;
            if (mediaServicesType == "ams")
            {
                mediaService = CreateAmsClient();
            }
            else if (mediaServicesType == "rms")
            {
                mediaService = CreateRmsClient();
            }
            else
            {
                throw new ArgumentException($"Invalid media service type: {mediaServicesType}");
            }

            await CreateTransformAsync(mediaService, TransformName);
            await Run(mediaService, inputFile);
        }

        public async Task Run(MediaServicesAccountResource mediaService, string inputFile)
        {
            // Creating a unique suffix for this test run
            string unique = Guid.NewGuid().ToString()[..13];
            string inputAssetName = $"input-{unique}";
            string overlayInputAssetName = $"input-overlay-{unique}";
            string outputAssetName = $"output-{unique}";
            string jobName = $"job-{unique}";
            string locatorName = $"locator-{unique}";
            string aes128locatorName = $"locator-{unique}-aes";
            string contentKeyPolicyName = ContentKeyPolicyAes128Name;

            // Get transform
            var transform = await mediaService.GetMediaTransforms().GetAsync(TransformName);

            MediaJobInputBasicProperties jobInput;
            if (IsUrl(inputFile))
            {
                var httpInput = new MediaJobInputHttp();
                httpInput.Files.Add(inputFile);
                jobInput = httpInput;
            }
            else
            {
                // Create input asset
                var inputAsset = await CreateAsset(mediaService, inputAssetName);
                Console.WriteLine($"Input asset created: {inputAsset.Data.Name} (container {inputAsset.Data.Container})");

                // Upload video to asset
                Console.WriteLine();
                Console.WriteLine("Uploading video to input asset...");
                await UploadFileToAsset(mediaService, inputAssetName, inputFile);

                Console.WriteLine("Video upload completed!");

                jobInput = new MediaJobInputAsset(inputAsset.Data.Name);
            }

            // Create overlay input asset
            var overlayInputAsset = await CreateAsset(mediaService, overlayInputAssetName);
            Console.WriteLine($"Input asset created: {overlayInputAsset.Data.Name} (container {overlayInputAsset.Data.Container})");

            Console.WriteLine("Uploading file to overlay input asset...");
            await UploadFileToAsset(mediaService, overlayInputAssetName, "DefaultInput/tests.png");

            // Add overlay
            jobInput = new MediaJobInputs
            {
                Inputs =
                {
                    jobInput,
                    new MediaJobInputAsset(assetName: overlayInputAssetName)
                    {
                        Label =  LogoMaskLabel,
                    }
                },
            };

            // Create output assets
            var outputAsset = await CreateAsset(mediaService, outputAssetName);
            Console.WriteLine();
            Console.WriteLine($"Output asset created: {outputAsset.Data.Name} (container {outputAsset.Data.Container})");

            // Create job
            var job = await SubmitJobAsync(transform, jobName, jobInput, outputAssetName);
            Console.WriteLine();
            Console.WriteLine($"Job created: {job.Data.Name}");

            // Track job progress
            job = await WaitForJobToFinishAsync(job);

            if (job.Data.State == MediaJobState.Error)
            {
                Console.WriteLine($"ERROR: Encoding job has failed {job.Data.Outputs.First().Error.Message}");
                return;
            }

            Console.WriteLine($"Job finished: {job.Data.Name}");

            // Create streaming locator
            await CreateStreamingLocatorAsync(mediaService, outputAsset.Data.Name, locatorName);
            Console.WriteLine();
            Console.WriteLine($"Streaming locator created: {locatorName}");
            var streamingEndpoint = (await mediaService.GetStreamingEndpoints().GetAsync(StreamingEndpointName)).Value;

            if (streamingEndpoint.Data.ResourceState != StreamingEndpointResourceState.Running)
            {
                await streamingEndpoint.StartAsync(WaitUntil.Completed);
            }

            // List streaming locator for asset
            var streamingLocator = (await mediaService.GetStreamingLocators().GetAsync(locatorName)).Value;

            // List url for streaming locator
            var paths = await streamingLocator.GetStreamingPathsAsync();

            var streamingUrls = new List<string>();

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for adaptive streaming:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (StreamingPath path in paths.Value.StreamingPaths)
            {
                foreach (string streamingFormatPath in path.Paths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.Data.HostName}{streamingFormatPath}";
                    Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    streamingUrls.Add(streamingUrl);
                }
            }

            Console.WriteLine();
            Console.WriteLine("The following URLs are available for downloads:");
            // All paths returned can be streamed when append it to steaming endpoint or CDN domain name
            foreach (string path in paths.Value.DownloadPaths)
            {
                var streamingUrl = $"https://{streamingEndpoint.Data.HostName}{path}";
                Console.WriteLine(streamingUrl);
                streamingUrls.Add(streamingUrl);
            }

            // Prepearing AES-128 encrypted HLS stream
            string issuer = "ravnur"; // Use your values for issuer and audience here
            string audience = "rmstest";
            // Create Content Key Policy for AES-128 encryption
            var contentKeyPolicy = await GetOrCreateContentKeyPolicyAsync(mediaService, contentKeyPolicyName, issuer, audience);
            // Create Streaming Locator with Content Key Policy
            var aesLocator = await CreateAES128StreamingLocatorAsync(mediaService, outputAsset.Data.Name, aes128locatorName, contentKeyPolicy.Data.Name);
            // List url for encrypted streaming
            var aesPaths = await aesLocator.GetStreamingPathsAsync();

            Console.WriteLine();
            Console.WriteLine("The following URL is available for adaptive streaming with AES-128 encryption:");
            foreach (StreamingPath path in aesPaths.Value.StreamingPaths)
            {
                foreach (string streamingFormatPath in path.Paths)
                {
                    var streamingUrl = $"https://{streamingEndpoint.Data.HostName}{streamingFormatPath}";
                    Console.WriteLine($"{path.StreamingProtocol}: {streamingUrl}");
                    streamingUrls.Add(streamingUrl);
                }
            }

            // Generate test token for AES-128 encryption
            var propertiesWithSecrets = await contentKeyPolicy.GetPolicyPropertiesWithSecretsAsync();
            ContentKeyPolicyTokenRestriction restriction = (ContentKeyPolicyTokenRestriction)propertiesWithSecrets.Value.Options.First().Restriction;
            ContentKeyPolicySymmetricTokenKey tokenKey = (ContentKeyPolicySymmetricTokenKey)restriction.PrimaryVerificationKey;
            var token = JWT.Encode(new Dictionary<string, object>
                {
                    { "exp", DateTimeOffset.UtcNow.AddHours(6).ToUnixTimeSeconds() },
                    { "nbf", DateTimeOffset.UtcNow.ToUnixTimeSeconds() },
                    { "iss", issuer },
                    { "aud", audience },
                    { "urn:microsoft:azure:mediaservices:contentkeyidentifier", aesLocator.Data.ContentKeys.First(x => x.KeyType == StreamingLocatorContentKeyType.EnvelopeEncryption).Id },
                },
                tokenKey.KeyValue,
                JwsAlgorithm.HS256);
            Console.WriteLine($"Token for encrypted playback (valid for 6hrs): {token}");
        }

        private MediaServicesAccountResource CreateAmsClient()
        {
            ArmClient armClient = new ArmClient(new DefaultAzureCredential());

            var mediaServicesAccountIdentifier = MediaServicesAccountResource.CreateResourceIdentifier(
                _azureOptions!.SubscriptionId,
                _azureOptions.ResourceGroupName,
                _azureOptions.MediaServicesAccountName);

            return armClient.GetMediaServicesAccountResource(mediaServicesAccountIdentifier);
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

        private static async Task<StreamingLocatorResource> CreateStreamingLocatorAsync(
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

        private static async Task<StreamingLocatorResource> CreateAES128StreamingLocatorAsync(
            MediaServicesAccountResource mediaService,
            string assetName,
            string locatorName,
            string contentKeyPolicyName)
        {
            var locator = await mediaService.GetStreamingLocators().CreateOrUpdateAsync(
                WaitUntil.Completed,
                locatorName,
                new StreamingLocatorData
                {
                    AssetName = assetName,
                    StreamingPolicyName = "Predefined_ClearKey",
                    DefaultContentKeyPolicyName = contentKeyPolicyName,
                });

            return locator.Value;
        }

        private static async Task<MediaJobResource> WaitForJobToFinishAsync(MediaJobResource job)
        {
            var sleepInterval = TimeSpan.FromSeconds(10);
            MediaJobState? state;
            int progress = 0;

            do
            {
                job = await job.GetAsync();
                state = job.Data.State.GetValueOrDefault();
                progress = job.Data.Outputs.FirstOrDefault()?.Progress ?? 0;

                Console.WriteLine($"Job state: {state}, progress: {progress}");
                if (state != MediaJobState.Finished && state != MediaJobState.Error && state != MediaJobState.Canceled)
                {
                    await Task.Delay(sleepInterval);
                }
            }
            while (state != MediaJobState.Finished && state != MediaJobState.Error && state != MediaJobState.Canceled);

            return job;
        }

        private static async Task<MediaJobResource> SubmitJobAsync(
            MediaTransformResource transform,
            string jobName,
            MediaJobInputBasicProperties input,
            string outputAssetsName)
        {
            var mediaJobData = new MediaJobData
            {
                Input = input
            };

            mediaJobData.Outputs.Add(new MediaJobOutputAsset(outputAssetsName));

            var job = await transform.GetMediaJobs().CreateOrUpdateAsync(
                WaitUntil.Completed,
                jobName,
                mediaJobData);

            return job.Value;
        }

        private static async Task<MediaAssetResource> UploadFileToAsset(
            MediaServicesAccountResource mediaService,
            string assetName,
            string fileName)
        {
            Response<MediaAssetResource> asset = await mediaService.GetMediaAssets().GetAsync(assetName);

            var sasUriCollection = asset.Value.GetStorageContainerUrisAsync(
                new MediaAssetStorageContainerSasContent
                {
                    Permissions = MediaAssetContainerPermission.ReadWrite,
                    ExpireOn = DateTime.UtcNow.AddHours(1),
                });

            var sasUri = await sasUriCollection.FirstOrDefaultAsync();

            var container = new BlobContainerClient(sasUri);
            BlobClient blob = container.GetBlobClient(Path.GetFileName(fileName));

            await blob.UploadAsync(fileName);

            return asset;
        }

        private static async Task<MediaAssetResource> CreateAsset(
            MediaServicesAccountResource mediaService,
            string assetName)
        {
            var asset = await mediaService.GetMediaAssets().CreateOrUpdateAsync(
                WaitUntil.Completed,
                assetName,
                new MediaAssetData());

            return asset.Value;
        }

        private async Task<ContentKeyPolicyResource> GetOrCreateContentKeyPolicyAsync(
            MediaServicesAccountResource mediaService,
            string policyName,
            string issuer,
            string audience)
        {
            try
            {
                return (await mediaService.GetContentKeyPolicies().GetAsync(policyName)).Value;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                // Continue to create a new policy
            }

            var contentKeyPolicyData = new ContentKeyPolicyData()
            {
                Description = "Test Content Key Policy",
            };

            // We use constant secret for testing purpose. Use RandoNumberGenerator.GetBytes(64) for production code
            var keyValue = Convert.FromBase64String("8RyJAV6mc6kk7m7ywFeyO6oUp0Jam1UoqvxEs/UhjrRElWdoD15R6iBWi1Am+En1s6Lv3pbYN94+Nt+3BdxETw==");
            var contentKeyRestriction = new ContentKeyPolicyTokenRestriction(
                issuer: issuer,
                audience: audience,
                primaryVerificationKey: new ContentKeyPolicySymmetricTokenKey(keyValue),
                restrictionTokenType: ContentKeyPolicyRestrictionTokenType.Jwt);
            contentKeyRestriction.RequiredClaims.Add(new ContentKeyPolicyTokenClaim
            {
                ClaimType = "urn:microsoft:azure:mediaservices:contentkeyidentifier",
            });
            
            var aes128ContentKeyPolicyOption = new ContentKeyPolicyOption(
                    configuration: new ContentKeyPolicyClearKeyConfiguration(),
                    restriction: contentKeyRestriction)
            {
                Name = "ae128-option",
            };

            contentKeyPolicyData.Options.Add(aes128ContentKeyPolicyOption);

            var policy = await mediaService.GetContentKeyPolicies().CreateOrUpdateAsync(WaitUntil.Completed, policyName, contentKeyPolicyData);
            return policy.Value;
        }

        private static async Task<MediaTransformResource> CreateTransformAsync(
            MediaServicesAccountResource mediaServicesAccount,
            string transformName)
        {
            var outputs = new MediaTransformOutput[]
            {
                new MediaTransformOutput(
                    new StandardEncoderPreset(
                        codecs: new MediaCodecBase[]
                        {
                            new AacAudio
                            {
                                Channels = 2,
                                SamplingRate = 48000,
                                Bitrate = 128000,
                                Profile = AacAudioProfile.AacLc,
                            },
                            new H264Video
                            {
                                KeyFrameInterval = TimeSpan.FromSeconds(2),
                                Layers =
                                {
                                    new H264Layer(bitrate: 3600000)
                                    {
                                        Width = "1280",
                                        Height = "720",
                                        Label = "HD-3600kbps",
                                    },
                                    new H264Layer(bitrate: 1600000)
                                    {
                                        Width = "960",
                                        Height = "540",
                                        Label = "SD-1600kbps",
                                    },
                                    new H264Layer(bitrate: 600000)
                                    {
                                        Width = "640",
                                        Height = "360",
                                        Label = "SD-600kbps",
                                    },
                                },
                            },
                            new JpgImage(start: "25%")
                            {
                                Start = "25%",
                                Step = "25%",
                                Range = "80%",
                                Layers =
                                {
                                    new JpgLayer
                                    {
                                        Width = "50%",
                                        Height = "50%",
                                        Label ="50perc",
                                    },
                                    new JpgLayer
                                    {
                                        Width = "30%",
                                        Height = "30%",
                                        Label ="30perc",
                                    },
                                    new JpgLayer
                                    {
                                        Width = "90%",
                                        Height = "90%",
                                        Label ="90perc",
                                    },
                                },
                            },
                        },
                        formats: new MediaFormatBase[]
                        {
                            new Mp4Format(filenamePattern: "Video-{Basename}-{Label}-{Bitrate}{Extension}"),
                            new JpgFormat(filenamePattern: "Thumbnail-{Basename}-{Label}-{Index}{Extension}"),
                        })
                    {
                        Filters =new FilteringOperations
                        {
                            Overlays =
                            {
                                new VideoOverlay(LogoMaskLabel)
                                {
                                    Start = TimeSpan.FromSeconds(3),
                                    End = TimeSpan.FromSeconds(10),
                                    Position = new RectangularWindow
                                    {
                                        Left ="75%",
                                        Top= "75%",
                                        Width= "25%",
                                        Height= "25%",
                                    },
                                    FadeInDuration = TimeSpan.FromSeconds(2),
                                }
                            }
                        }
                    }),
            };

            var tranformData = new MediaTransformData
            {
                Description = "A simple custom encoding transform with 2 outputs",
            };

            foreach (var output in outputs)
            {
                tranformData.Outputs.Add(output);
            }

            var transform = await mediaServicesAccount.GetMediaTransforms().CreateOrUpdateAsync(
                WaitUntil.Completed,
                transformName,
                tranformData);

            return transform.Value;
        }

        private static bool IsUrl(string path) => Uri.TryCreate(path, UriKind.Absolute, out Uri? uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
