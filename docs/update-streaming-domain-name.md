# How to update Streaming Domain name for RMS

You need to perform this action if you want to see a different domain name in your streaming links. For example, if you want to use your custom CDN or a custom domain in the RMS front door.

## Prerequisites:

You have domain name which is already mapped to RMS streaming origin.

## Steps:

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
