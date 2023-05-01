<div>
<img src="https://user-images.githubusercontent.com/10156527/235540959-9bd111dd-2a6c-48e8-b29f-dc0db0e946f5.png" width="120">
</div>

# Crypto Warden
Crypto Warden is an app to securely store your crypto wallet seed phrases.
It works by leveraging your personal Apple Keychain in order to save your data and share it across all your Apple devices.
Data never flow outside of the keychain, you can checkout our security model here: [link](https://getsentinel.io/security-model)

## Value Proposition
To begin with, it is widely accepted that non-custodial wallets should be used by all crypto users instead of keeping their crypto on exchanges. However, managing seed phrases can be challenging and may create an entry barrier for the adoption of crypto, in my opinion.

To address this issue, I have developed Crypto Warden, which simplifies seed phrase management in the following ways:

1. It is easy to use and allows you to copy and paste your seed phrase on both mobile and desktop, preventing you from storing it on the first note-taking app you come across;
2. It syncs across multiple devices, ensuring that all your data is automatically restored if you purchase a new device.

Critics of Crypto Warden may argue that storing your data in the cloud poses a security risk. While this is true, Apple has implemented state-of-the-art security measures, and a breach in their security would be a rare occurrence with cataclysmic consequences (a black swan event). Consider how many passwords stored in the Safari keychain that would be compromised in the event of a breach.

In conclusion, Crypto Warden offers improved user experience and usability, albeit at the cost of trusting Apple's security team.

# Integration with External Apps
As of ```v1.2``` Crypto Warden supports integration with URLs to ingest programmatically new wallets.
If you own a non-custodial wallet provider you can automatically store the seed phrase generated within Crypto Warden.

The URL should be formatted as the following:
```url
cryptowarden://<walletname (mandatory)>?
seed=<seed-phrase (mandatory)>
&address=<wallet-address (optional)>
&password=<wallet password (optional)>
&provider=<entity that generated the seed (optional)>
```

Substitute the necessary
```<variable>``` with the related value. <br>
Hereafter is provided and example: <br>
```url
cryptowarden://Main%20Wallet?seed=water2%20house%20magic%20panda%20light%20bear%20sky%20nine%20field%20mine%20tank%20watch&password=38926g4287tviy3t&provider=metamask
```

If you want to test it on the iOS simulator run:
```url
xcrun simctl openurl booted "cryptowarden://Main%20Wallet?seed=water2%20house%20magic%20panda%20light%20bear%20sky%20nine%20field%20mine%20tank%20watch&password=38926g4287tviy3t&provider=metamask"
```

## Where to download
You can download the app directly from the [App Store](https://apps.apple.com/us/app/crypto-warden/id1663191731) for iOS and macOS.
The Android version is still not here. If you have proposal on how to securely sync data between iOS and Android let's discuss it.

More details and all the features can be found at this [link](https://getsentinel.io/crypto-warden).

## Can you run on your own
Answer is yes, but it requires a few integrations from your side.
As described in the [Security Model](https://getsentinel.io/security-model) it leverages Firebase to provide Apple Sign-In in order to sync the purchase of the one-time-fee to support my work and unlock the premium version across all your devices.

If you have troubles and want to run it on your own write me at [hello@getsentinel.io](mailto:hello@getsentinel.io) and I'll try to support.

## How it looks

<div>
<img src="https://user-images.githubusercontent.com/10156527/222992722-a0540535-af7a-4eee-bdfc-1d1ba8ce5728.png" width="250">
<img src="https://user-images.githubusercontent.com/10156527/222992720-a4e679b6-5f84-4e1b-b8cb-c124d48e26b4.png" width="250">
</div>

## Other apps from Sentinel
If you like Crypto Warden you may have a look also at my [2FA Authenticator](https:/getsentinel.io) app.
