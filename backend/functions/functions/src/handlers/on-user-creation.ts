import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialisez Firebase Admin avec les credentials explicites
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  logger.info("Firebase Admin initialized.");
} else {
  logger.info("Firebase Admin already initialized.");
}

// Fonction pour générer un nom d'utilisateur unique
export const generateUsername = async (): Promise<string> => {
  let username: string;
  let exists: boolean;

  do {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    username = `coin${randomNumber}`;
    logger.info(`Generated username: ${username}`);

    try {
      // Vérifiez si le nom d'utilisateur existe déjà
      const userSnapshot = await admin
        .firestore()
        .collection("users")
        .where("username", "==", username)
        .get();
      exists = !userSnapshot.empty;
      if (exists) {
        logger.info(
          `Username ${username} already exists. Generating a new one.`,
        );
      }
    } catch (error) {
      logger.error("Error checking if username exists:", error);
      throw new Error("Firestore query failed");
    }
  } while (exists);

  return username;
};

// Fonction déclenchée lors de la création d'un nouvel utilisateur
export const onUserCreate = functions
  .region("europe-west1")
  .auth.user()
  .onCreate(async (user) => {
    const uid = user.uid;

    logger.info(`New user created: UID=${uid}`);

    // Vérifiez si l'UID ressemble
    // à une adresse MetaMask (longueur 42 et commence par '0x')
    if (uid.length === 42 && uid.startsWith("0x")) {
      logger.info("User is identified as a MetaMask user.");

      try {
        const username = await generateUsername();
        logger.info(`Generated username for MetaMask user: ${username}`);

        // Mettre à jour le profil utilisateur avec le pseudonyme généré
        await admin.auth().updateUser(uid, {
          displayName: username,
        });
        logger.info(
          `User profile updated for UID=${uid} with username=${username}`,
        );

        // Enregistrer le nom d'utilisateur dans Firestore
        const userRef = admin.firestore().collection("users").doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) {
          logger.info("User document does not exist. Creating a new document.");
          await userRef.set({
            username: username,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            provider: "MetaMask",
          });
          logger.info(`User document created for UID=${uid}`);
        } else {
          logger.info(`User document already exists for UID=${uid}`);
        }
      } catch (error) {
        logger.error("Error during user creation process:", error);
      }
    } else {
      logger.info(
        `User UID=${uid} is not a MetaMask address. No action taken.`,
      );
    }
  });
