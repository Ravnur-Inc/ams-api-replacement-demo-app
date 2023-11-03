namespace VodCreatorApp.Configuration
{
    public class TransformOptions
    {
        public string Name { get; set; }

        public string? OutputsJsonFile { get; set; }

        public bool ShareOutputAsset { get; set; } = false;
    }
}
