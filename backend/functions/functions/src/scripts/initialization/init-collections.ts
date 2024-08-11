// src/scripts/initializeData.ts
import * as serviceAccount from '../credentials/tot-poc-firebase-adminsdk-aaij3-9bbecf3f9a.json';

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Class } from './model/class';
import { Skill } from './model/skill';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: 'tot-poc'  // Remplacez par l'ID de votre projet Firebase
});

const db = admin.firestore();

const classesDir = path.join(__dirname, './classes');
const skillsDir = path.join(__dirname, './skills');

/**
 * Fonction pour lire un fichier JSON.
 */
function readJsonFile(filePath: string): any {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

/**
 * Fonction pour initialiser les collections Firestore avec les classes et les compétences.
 */
async function initializeSkillsAndClasses() {
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

    try {
        await batch.commit();
        console.log('Classes et compétences initialisées dans Firestore.');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données:', error);
    }
}

// Exécuter l'initialisation
initializeSkillsAndClasses();
