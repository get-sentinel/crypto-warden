import auth from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// webClientId is the "Web client" OAuth client ID from Firebase Console
// (client_type 3 in google-services.json, or the CLIENT_ID in GoogleService-Info.plist)
GoogleSignin.configure({
    webClientId: '276341970316-ivmf0qonuhn3om1rbjrj5b6nbt2ffdc9.apps.googleusercontent.com',
    iosClientId: '276341970316-5tak3kg4l44kkq5ike7kr21k48nmpuss.apps.googleusercontent.com',
});

export async function signInWithGoogle() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
    if (!idToken) throw new Error('Google Sign-In failed - no ID token returned');
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    return auth().signInWithCredential(googleCredential);
}

export async function signInWithAppleCredentials() {
    const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
    });

    if (!appleAuthRequestResponse.identityToken) {
        throw 'Apple Sign-In failed - no identify token returned';
    }

    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    return auth().signInWithCredential(appleCredential);
}

export async function signInWithEmail(email: string, password: string) {
    return auth().signInWithEmailAndPassword(email, password);
}

export async function createAccountWithEmail(email: string, password: string) {
    return auth().createUserWithEmailAndPassword(email, password);
}

export async function signOut() {
    auth().signOut();
}

export async function deleteAccount() {
    auth().currentUser?.delete();
    auth().signOut();
}
