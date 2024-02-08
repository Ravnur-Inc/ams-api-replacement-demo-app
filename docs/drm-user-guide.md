# This instruction is about how to use DRM feature

## Widevine DRM
Widevine DRM technology works on webkit browsers (Chrome, Opera, Firefox) on Windows and macOS.

1. To use it first you need to create ContentKeyPolicy with Widevine option:
![screenshot](img/widevine-ckp.png)

2. Then you need to create Streaming Locator for existing asset with appropriate Content Key Policy and Streaming Policy. Streaming Policy should be Predefined_MultiDrmStreaming or Predefined_MultiDrmCencStreaming:
![screenshot](img/widevine-sl.png)

3. Then you need to get streaming paths:
![screenshot](img/widevine-paths.png)

4.For playback testing we can use SHAKA Player. Go To https://shaka-player-demo.appspot.com/demo -> Custom Content and crate new player source. Enter streaming url to Manifest URL field:
![screenshot](img/widevine-shaka-main.png)

5. Select DRM pane. In Custom License SErver URL field you need to enter https://widevine-dash.ezdrm.com/widevine-php/widevine-foreignkey.php?pX=[ezdrm_widevine__profile_id]&locatorid=[locator_id]&authorization=[token]
![screenshot](img/widevine-shaka-drm.png)

ezdrm_widevine__profile_id - get from Widevine DRM profile in your EZDRM Account:
![screenshot](img/widevine-ezdrm-id.png)

locator_id - ID of Streaming Locator you have created on step 2

token - JWT token to authorize your access to media.

6. Now media can be played
