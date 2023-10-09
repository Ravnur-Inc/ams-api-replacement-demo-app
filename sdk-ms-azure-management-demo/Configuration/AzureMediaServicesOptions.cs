namespace VodCreatorApp.Configuration
{
    public class AzureMediaServicesOptions : MediaServicesOptionsBase
    {
        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public string AadTenantId { get; set; }

        public string ApiEndpoint { get; set; } = "https://management.azure.com/";
    }
}
