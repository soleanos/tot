import * as serviceAccount from '../credentials/tot-poc-firebase-adminsdk-aaij3-9bbecf3f9a.json';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Class } from './model/class';
import { Skill } from './model/skill';
import { Equipment } from './model/equipment';  // Assurez-vous que ce modèle existe

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: 'tot-poc'  // Remplacez par l'ID de votre projet Firebase
});

const db = admin.firestore();

const classesDir = path.join(__dirname, './classes');
const skillsDir = path.join(__dirname, './skills');
const equipmentsDir = path.join(__dirname, './equipments');
const rarityFilePath = path.join(__dirname, './rarity/rarity.json');

/**
 * Fonction pour lire un fichier JSON.
 */
function readJsonFile(filePath: string): any {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

/**
 * Fonction pour supprimer toutes les documents d'une collection Firestore.
 */
async function deleteCollection(collectionPath: string) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Collection '${collectionPath}' supprimée.`);
}

/**
 * Fonction pour initialiser les collections Firestore avec les classes, compétences, équipements et raretés.
 */
async function initializeData() {
    // Supprimer les collections existantes
    await deleteCollection('classes');
    await deleteCollection('skills');
    await deleteCollection('equipments');
    await deleteCollection('rarity');

    const batch = db.batch();

    // Importer les classes
    const classFiles = fs.readdirSync(classesDir);
    classFiles.forEach((file) => {
        const classData = readJsonFile(path.join(classesDir, file)) as Class;
        const classRef = db.collection('classes').doc(classData.classId);
        batch.set(classRef, classData);
    });

    // Importer les compétences
    const skillFiles = fs.readdirSync(skillsDir);
    skillFiles.forEach((file) => {
        const skillData = readJsonFile(path.join(skillsDir, file)) as Skill;
        const skillRef = db.collection('skills').doc(skillData.skillId);
        batch.set(skillRef, skillData);
    });

    // Importer les équipements
    const equipmentFiles = fs.readdirSync(equipmentsDir);
    equipmentFiles.forEach((file) => {
        const equipmentData = readJsonFile(path.join(equipmentsDir, file)) as Equipment;
        const equipmentRef = db.collection('equipments').doc(equipmentData.id);
        batch.set(equipmentRef, equipmentData);
    });

    // Importer les taux de rareté
    const rarityData = readJsonFile(rarityFilePath);
    Object.keys(rarityData.levels).forEach((level) => {
        const rarityRef = db.collection('rarity').doc(level);
        batch.set(rarityRef, rarityData.levels[level]);
    });

    try {
        await batch.commit();
        console.log('Classes, compétences, équipements et raretés initialisés dans Firestore.');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données:', error);
    }
}

// Exécuter l'initialisation
initializeData();
