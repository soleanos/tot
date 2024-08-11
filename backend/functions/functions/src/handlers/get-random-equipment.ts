import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

type RarityData = {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
};

export const getRandomEquipment = functions.https.onCall(async (data, context) => {
    const userId = context.auth?.uid;
    const chestLevel = data.chestLevel;

    if (!userId) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    if (typeof chestLevel !== "number") {
        throw new functions.https.HttpsError("invalid-argument", "Chest level must be a number.");
    }

    // Récupérer les taux de rareté en fonction du niveau de coffre
    const rarityDocRef = db.collection("rarity").doc(`level_${chestLevel}`);
    const rarityDoc = await rarityDocRef.get();

    if (!rarityDoc.exists) {
        throw new functions.https.HttpsError("not-found", `Rarity data not found for level ${chestLevel}.`);
    }

    const rarityData = rarityDoc.data() as RarityData;

    // Calculer la rareté en fonction des taux
    const rarity = getRandomRarity(rarityData);

    // Filtrer les équipements en fonction de la rareté
    const equipmentCollection = db.collection("equipments");
    const equipmentSnapshot = await equipmentCollection.where("rarity", "==", rarity).get();

    if (equipmentSnapshot.empty) {
        throw new functions.https.HttpsError("not-found", `No equipment found for rarity ${rarity}.`);
    }

    // Choisir un équipement aléatoire parmi les résultats
    const equipmentDocs = equipmentSnapshot.docs;
    const randomEquipmentDoc = equipmentDocs[Math.floor(Math.random() * equipmentDocs.length)];
    const equipmentData = randomEquipmentDoc.data();

    // Récupérer les informations du joueur
    const playerRef = db.collection("players").doc(userId);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Player not found.");
    }

    const playerData = playerDoc.data();
    if (!playerData) {
        throw new functions.https.HttpsError("not-found", "Player data is undefined.");
    }

    const calculatedStats = calculateEquipmentStats(equipmentData, playerData.level);

    // Générer un UID unique pour l'équipement
    const uniqueEquipmentId = db.collection("temporaryEquipments").doc().id;

    // Créer l'objet équipement temporaire
    const temporaryEquipment = {
        uid: uniqueEquipmentId,
        equipmentId: equipmentData.id,
        name: equipmentData.name,
        description: equipmentData.description,
        image: equipmentData.image,
        calculatedStats: calculatedStats,
        xpValue: calculateXpValue(equipmentData.rarity, playerData.level),
        goldValue: calculateGoldValue(equipmentData.rarity, playerData.level),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Stocker l'équipement temporaire dans Firestore
    const temporaryEquipmentsRef = db.collection("players").doc(userId).collection("temporaryEquipments");
    await temporaryEquipmentsRef.doc(uniqueEquipmentId).set(temporaryEquipment);

    return {
        success: true,
        equipment: temporaryEquipment,
    };
});

/**
 * Fonction pour obtenir une rareté aléatoire en fonction des taux de rareté.
 */
function getRandomRarity(rarityData: RarityData): keyof RarityData {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const rarity in rarityData) {
        if (rarityData.hasOwnProperty(rarity)) {
            cumulative += rarityData[rarity as keyof RarityData];
            if (rand < cumulative) {
                return rarity as keyof RarityData;
            }
        }
    }

    return "common"; // Retourne la rareté par défaut si rien n'est trouvé
}

/**
 * Fonction pour calculer les statistiques de l'équipement en fonction du niveau du joueur.
 */
function calculateEquipmentStats(equipmentData: any, playerLevel: number): any {
    // Exemple de calcul, peut être personnalisé
    return {
        attack: equipmentData.baseStats.attack + playerLevel * 2,
        defense: equipmentData.baseStats.defense + playerLevel * 1.5,
        speed: equipmentData.baseStats.speed + playerLevel * 1.2,
    };
}

/**
 * Fonction pour calculer la valeur d'XP en fonction de la rareté et du niveau du joueur.
 */
function calculateXpValue(rarity: keyof RarityData, playerLevel: number): number {
    const rarityMultiplier = {
        common: 1,
        rare: 2,
        epic: 3,
        legendary: 5,
    };
    return playerLevel * (rarityMultiplier[rarity] || 1) * 10;
}

/**
 * Fonction pour calculer la valeur d'or en fonction de la rareté et du niveau du joueur.
 */
function calculateGoldValue(rarity: keyof RarityData, playerLevel: number): number {
    const rarityMultiplier = {
        common: 5,
        rare: 10,
        epic: 20,
        legendary: 50,
    };
    return playerLevel * (rarityMultiplier[rarity] || 5) * 10;
}
