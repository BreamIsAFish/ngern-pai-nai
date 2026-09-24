import 'package:extension_google_sign_in_as_googleapis_auth/extension_google_sign_in_as_googleapis_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis_auth/googleapis_auth.dart';

class GoogleAuthService {
  GoogleAuthService()
    : _googleSignIn = GoogleSignIn(
        scopes: const [drive.DriveApi.driveFileScope],
      );

  final GoogleSignIn _googleSignIn;

  GoogleSignInAccount? get currentAccount => _googleSignIn.currentUser;

  Future<GoogleSignInAccount?> restoreSession() async {
    if (_googleSignIn.currentUser != null) return _googleSignIn.currentUser;
    return _googleSignIn.signInSilently();
  }

  Future<GoogleSignInAccount> signIn() async {
    final account = await _googleSignIn.signIn();
    if (account == null) throw const GoogleAuthCancelled();
    return account;
  }

  Future<void> disconnect() => _googleSignIn.disconnect();

  Future<AuthClient> authenticatedClient() async {
    await restoreSession();
    final client = await _googleSignIn.authenticatedClient();
    if (client == null) throw const GoogleAuthRequired();
    return client;
  }
}

class GoogleAuthCancelled implements Exception {
  const GoogleAuthCancelled();
}

class GoogleAuthRequired implements Exception {
  const GoogleAuthRequired();
}
