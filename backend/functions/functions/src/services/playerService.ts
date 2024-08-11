import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Fonction pour créer un joueur dans Firestore.
 * @param {string} address - L'adresse (ou UID) du joueur.
 * @param {string} username -
 * Le nom d'utilisateur généré pour le joueur.
 * @param {string} [classId="token_vagabond"] -
 * L'ID de la classe de départ (par exemple, 'token_vagabond').
 * @return {Promise<void>} Une promesse qui se résout une fois le joueur créé.
 */
export const createPlayer = async (
  address: string,
  username: string,
  classId = "token_vagabond",
): Promise<void> => {
  try {
    const playersCollectionRef = admin.firestore().collection("players");
    const playerDocRef = playersCollectionRef.doc(address);

    // Vérifiez si le joueur existe déjà
    const playerDoc = await playerDocRef.get();
    if (playerDoc.exists) {
      logger.info(`Le joueur avec l'UID=${address} existe déjà.`);
      return; // Ne rien faire si le joueur existe déjà
    }

    // Récupérer le modèle de la classe depuis Firestore
    const classDocRef = admin.firestore().collection("classes").doc(classId);
    const classDoc = await classDocRef.get();

    if (!classDoc.exists) {
      throw new Error(`La classe ${classId} n'existe pas dans Firestore.`);
    }

    const classData = classDoc.data();
    if (!classData) {
      throw new Error(`Données de la classe ${classId} non trouvées.`);
    }

    // Initialisation du joueur avec les attributs de départ de la classe
    await playerDocRef.set({
      username: username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      provider: "MetaMask", // Ou "Google" ou autre selon le cas
      level: 1,
      xp: 0,
      classId: classId,
      attributes: classData.startingAttributes, // Attributs de départ
      currentSetId: null, // Pas de set par défaut
    });

    logger.info(`Document joueur créé pour UID=${address}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors de la création du joueur", {
        message: error.message,
        stack: error.stack,
      });
      throw new Error("Erreur lors de la création du joueur: " + error.message);
    } else {
      logger.error("Erreur inconnue lors de la création du joueur", {error});
      throw new Error("Erreur inconnue lors de la création du joueur.");
    }
  }
};
