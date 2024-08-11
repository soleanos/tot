import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const equipEquipment = functions.https.onCall(async (data, context) => {
    const userId = context.auth?.uid;
    const equipmentId = data.equipmentId;

    if (!userId) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    if (!equipmentId || typeof equipmentId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "Equipment ID must be a valid string.");
    }

    // Récupérer l'équipement temporaire depuis la collection temporaryEquipments
    const tempEquipmentRef = db.collection("players").doc(userId).collection("temporaryEquipments").doc(equipmentId);
    const tempEquipmentDoc = await tempEquipmentRef.get();

    if (!tempEquipmentDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Temporary equipment not found.");
    }

    const equipmentData = tempEquipmentDoc.data();

    if (!equipmentData) {
        throw new functions.https.HttpsError("not-found", "Equipment data is undefined.");
    }

    // Récupérer le profil du joueur
    const playerRef = db.collection("players").doc(userId);
    const playerDoc = await playerRef.get();

    if (!playerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Player not found.");
    }

    const playerData = playerDoc.data();

    if (!playerData) {
        throw new functions.https.HttpsError("not-found", "Player data is undefined.");
    }

    // Ajouter l'équipement au currentSet du joueur
    const playerSetRef = playerRef.collection("currentSet").doc(equipmentId);
    await playerSetRef.set({
        ...equipmentData,
        equippedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mettre à jour les statistiques du joueur
    const updatedAttributes = {
        attack: playerData.attributes.attack + (equipmentData.calculatedStats.attack || 0),
        defense: playerData.attributes.defense + (equipmentData.calculatedStats.defense || 0),
        speed: playerData.attributes.speed + (equipmentData.calculatedStats.speed || 0),
        // Ajouter d'autres statistiques si nécessaire
    };

    await playerRef.update({
        attributes: updatedAttributes,
    });

    // Supprimer l'équipement de la collection temporaryEquipments
    await tempEquipmentRef.delete();

    return {
        success: true,
        message: `Equipment ${equipmentData.name} equipped successfully.`,
    };
});
