import auth from '@react-native-firebase/auth';
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import GoogleSignInConfig from '../config/GoogleSignIn.json';
import { Platform } from 'react-native';

GoogleSignin.configure({
    webClientId: GoogleSignInConfig.webClientId,
});


const appleSignOnAndroid = () => {
    const rawNonce = 'ndrohvfboy';
    const state = 'ndrohvcrqfeuri3fboy';
    // Configure the request
    appleAuthAndroid.configure({
        // The Service ID you registered with Apple
        clientId: 'com.sentinel.service.warden',

        // Return URL added to your Apple dev console. We intercept this redirect, but it must still match
        // the URL you provided to Apple. It can be an empty route on your backend as it's never called.
        redirectUri: 'https://obsidian-a186a.firebaseapp.com/__/auth/handler',

        // The type of response requested - code, id_token, or both.
        responseType: appleAuthAndroid.ResponseType.ALL,

        // The amount of user information requested from Apple.
        scope: appleAuthAndroid.Scope.ALL,
        nonce: rawNonce,

        // Unique state value used to prevent CSRF attacks. A UUID will be generated if nothing is provided.
        state,
    });

    // Open the browser window for user sign in
    return appleAuthAndroid.signIn();

    // Send the authorization code to your backend for verification
}

export async function signInWithAppleCredentials() {
    if (Platform.OS === 'android') {
        return appleSignOnAndroid()
    } else {
        return appleSignOnIoS()
    }

}

const appleSignOnIoS = async () => {

    const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
    });

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
        throw 'Apple Sign-In failed - no identify token returned';
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    await auth().currentUser?.linkWithCredential(appleCredential);

    // Sign the user in with the credential
    return auth().signInWithCredential(appleCredential)
        .catch((error) => { console.log(error) })
}

export async function signInWithGoogleCredentials() {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Get the users ID token
    const { idToken } = await GoogleSignin.signIn();

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    // await auth().currentUser?.linkWithCredential(googleCredential);

    // Sign-in the user with the credential
    return auth().signInWithCredential(googleCredential)
        .catch((error) => { console.log(error) })
}

export async function signOut() {
    auth().signOut()
}

export async function deleteAccount() {
    auth().currentUser?.delete()
    auth().signOut()
}

export const isProviderAuthenticated = (providerId: string) => {
    let providerExists = auth().currentUser?.providerData.filter((provider) => provider.providerId === providerId).length

    return !(providerExists === 0 || providerExists === null || providerExists === undefined)
}