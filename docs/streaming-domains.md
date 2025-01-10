# RMS Streaming Endpoint and CDN

## Overview

By default, an RMS cluster exposes two endpoints for video on demand streaming:
* Streaming Origin Endpoint
* Front Door Endpoint

## Streaming Origin Endpoint

The Streaming Origin Endpoint is a streaming server load balancer.
The Streaming Origin domain looks like this: `i-rms.{RMS DNS zone}`.
You can find the RMS DNS zone in your RMS resource group. By default, there is only one DNS zone resource in your RMS resource group.
![RMS Console endpoints](img/portal-RMS-origin-domain.jpg)

> **Note:**
> * The Streaming Origin Endpoint is public, but you should not use it directly. This method uses the public internet for transport, which causes latency and security issues. You should either use the RMS [Front Door Endpoint](#front-door-endpoint) or your own CDN endpoint mapped to the RMS Streaming Origin.
> * If you use Azure Front Door or Azure Standard CDN (classic), we can make this endpoint private for you and hide it from public access.
> * If you use another CDN provider, the endpoint cannot be private. However, we are working on a solution and plan to implement it before the Azure Standard CDN end-of-life.

> **Note:**
> It is not recommended to map your custom CDN/Azure Front Door to the RMS Front Door Endpoint.
> If you migrated from Azure Media Services with your own CDN, you likely mapped it to Azure Front Door. Please map it to the Streaming Origin Endpoint instead.

## Front Door Endpoint

The Front Door Endpoint provides you with:
* Efficient routing to the Streaming Origin Endpoint using the Azure network, bypassing the public internet.
* Advanced configuration options, such as caching, compression, WAF firewall rules, and managed SSL certificates for custom domains.

The Front Door Endpoint domain name looks like this: `fd-{unique string}.{AFD DNS subdomain}.azurefd.net`. It is the default hostname of the Streaming Endpoint in the RMS Console. However, if you have already changed it, you can find it in your RMS resource group. Its name is `fd-{unique string}`, and it is the only front door in your resource group.
![RMS Console endpoints](img/portal-RMS-front-door-endpoint.jpg)

## Questions and Answers

### Can I enable caching in my RMS Front Door instead of using an additional CDN?

Yes, we can do it for you. It is the most cost-effective way to set up a CDN for your RMS cluster, with the additional benefit of making the Streaming Origin Endpoint private.

### How to Integrate a Custom CDN with the RMS Streaming Endpoint?

* Map your CDN to the Streaming Origin Endpoint.
* Do not map it to the RMS Front Door Endpoint, as it is considered bad practice according to the [official documentation](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-faq#can-i-deploy-another-cdn-from-an-external-vendor-behind-or-in-front-of-front-door).
* Use the **Ignore Query String** option.
* No other configurations are required.
* [Update the Streaming Endpoint Host Name in the RMS Console](#how-to-update-the-rms-streaming-endpoint-host-name).

### How to Use a Custom Domain with the RMS Front Door?

1. Create a CNAME record for the alias host domain so that it points to the RMS native Front Door Endpoint: `fd-{unique string}.{AFD DNS subdomain}.azurefd.net`. You can find how to get the RMS Front Door domain [here](#how-to-get-the-rms-front-door-domain). Documentation on creating and mapping a CNAME is available here: [Add a custom domain to Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-custom-domain#create-a-cname-dns-record).
2. Make an RMS support request (by email) to add your custom domain name to the RMS Front Door. Provide RMS support with your domain name and RMS resource group.
3. [Update your Streaming Endpoint host name in the RMS console](#how-to-update-the-rms-streaming-endpoint-host-name).

### How to Update the RMS Streaming Endpoint Host Name?

1. Go to the RMS Console.
2. Choose your account -> Manage -> Streaming Endpoints.
3. Change the **Host Name** property field and press the **Save** button:
   ![RMS Console endpoints new console](img/console-SE-change-domain-new.jpg)
   For the old console:
   ![RMS Console endpoints old console](img/console-SE-change-domain.jpg)

> **Note:**
> If you do not compose streaming links dynamically and store them as static URLs, or if your application stores the streaming domain somewhere in its configuration, do not forget to update all these locations accordingly.

### Why Do I Need to Update the Streaming Endpoint Host Name in the RMS Console?

Most likely, your application requests the RMS API to obtain the domain name used in your streaming links. Therefore, you need to update it so your application receives the new domain name when composing streaming links.

If your application retrieves the domain from its own configuration, this action isn't required, and you should update your configurations instead.

### What is the Default Cache TTL for RMS Content?

Currently, the default value is 100 days for VOD content and 6 days for downloads. If you want, we can change it for you, but downloads cannot be cached for more than 7 days.

> **Note:**
> We do not recommend enabling the "Always Cache" behavior in your CDN. Some responses shouldn't be cached, and the streaming origin knows better which ones not to cache.

### How to choose CDN provider?

We are making research in this direction, but at the moment this is what we currently suggest:

* **Azure Front Door**: Not optimal for media streaming, but it can hide the origin endpoint.
* **Azure Standard CDN (classic)**: More efficient for media delivery and also allows hiding the origin endpoint from public access. However, it will be [retired in 2027](https://azure.microsoft.com/en-us/updates?id=Azure-CDN-Standard-from-Microsoft-classic-will-be-retired-on-30-September-2027).
* **Fastly**: More efficient than the previous two and Azure Front Door. Drawbacks: limited POP availability in some regions and no ability to hide the origin endpoint from public access.
* **Akamai**: Very efficient but expensive and also does not allow hiding the origin endpoint from public access.

