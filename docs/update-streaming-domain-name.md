# RMS streaming domain

## Default streaming domains

By default RMS has two domain names which can be used in streaming links: RMS front door domain and RMS origin streaming endpoint domain.
Front door endpoint works is a CDN and RMS uses it by default (Streaming Endpoint Host Name). It is not recommended to use RMS origin domain directly for streaming but you can map your custom CDN to it.

### How to get RMS front door domain?

RMS front door domain name looks like this “fd-{unique string}.{AFD DNS subdomain}.azurefd.net”.
You can find it in your RMS resource group. It's name is fd-{unique string} and it is the only front door in your resource group.
It contains only one default endpoint:
![RMS Console endpoints](img/portal-RMS-front-door-endpoint.jpg)

### How to obtain RMS origin domain?

RMS origin domain looks like this "i-rms.{unique string}.ravnur.net"
You can find exact name by finding your RMS DNS zone in your RMS resource group. There is only one DNS zone resource in your RMS resource group.
![RMS Console endpoints](img/portal-RMS-origin-domain.jpg)

## How to use custom domain with RMS front door?

* Create the CNAME record for the alias host domain so that it points to the RMS native front door endpoint “fd-{unique string}.{AFD DNS subdomain}.azurefd.net”. Documentation on how to create and map CNAME is here - Add a custom domain to Azure Front Door.
* Make an RMS support request (by email) to add your custom domain name to the RMS front door. Provide RMS support with your domain name and RMS resource group.

## How to update RMS Streaming Domain name?

If you decided to your custom CDN or custom domain name in RMS front door you need to perform this action.

### Prerequisites:

You have domain name which is already mapped to RMS streaming origin "i-rms.{unique string}.ravnur.net" (CDN domain name or custom domain name in RMS front door).

### Steps:

1. Go to the RMS Console.
2. Choose your account -> Manage -> Streaming Endpoints.
3. Change the **Host Name** property field and press the **Save** button:
   ![RMS Console endpoints new console](img/console-SE-change-domain-new.jpg)
   For the old console:
   ![RMS Console endpoints old console](img/console-SE-change-domain.jpg)

4. Change the streaming domain name on your side:
   - **Update static streaming links** with the new domain name. If your application dynamically composes streaming links and does not store static ones, this step is not required.
   - **Update your configuration.** If your application requests the streaming domain from the RMS API and does not store the domain in its configuration, this step is not required.
name. If your application composes streaming links dynamically and do not store static ones then this step is not required.
