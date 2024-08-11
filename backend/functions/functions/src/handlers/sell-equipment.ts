import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const sellEquipment = functions.https.onCall(async (data, context) => {
    const userId = context.auth?.uid;
    const equipmentId = data.equipmentId;

    if (!userId) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    if (!equipmentId || typeof equipmentId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Equipment ID must be a valid string.");
    }

    // Références aux collections
    const playerRef = db.collection("players").doc(userId);
    const playerSetRef = playerRef.collection("currentSet").doc(equipmentId);

    // Vérifier si l'équipement existe dans le set actuel du joueur
    const equipmentDoc = await playerSetRef.get();
    if (!equipmentDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Equipment not found in player's current set.");
    }

    const equipmentData = equipmentDoc.data();

    if (!equipmentData) {
        throw new functions.https.HttpsError("not-found", "Equipment data is undefined.");
    }

    // Récupérer les informations du joueur
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Player not found.");
    }

    const playerData = playerDoc.data();
    if (!playerData) {
        throw new functions.https.HttpsError("not-found", "Player data is undefined.");
    }

    // Calculer l'XP et l'or à ajouter
    const xpToAdd = equipmentData.xpValue;
    const goldToAdd = equipmentData.goldValue;

    // Mettre à jour le joueur avec l'or et l'XP gagnés
    await playerRef.update({
        xp: admin.firestore.FieldValue.increment(xpToAdd),
        gold: admin.firestore.FieldValue.increment(goldToAdd),
    });

    // Supprimer l'équipement du set du joueur
    await playerSetRef.delete();

    return {
        success: true,
        message: `Equipment sold successfully. Gained ${xpToAdd} XP and ${goldToAdd} gold.`,
    };
});
