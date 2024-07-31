import * as admin from "firebase-admin";

/**
 * Initializes Firebase Admin SDK.
 * If running in the emulator, sets the emulator host for Firebase Auth.
 */
export function initializeFirebaseAdmin() {
  if (process.env.FUNCTIONS_EMULATOR) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
  }
  admin.initializeApp();
}
