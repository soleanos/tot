// src/scripts/initializeData.ts
import * as admin from 'firebase-admin';
import * as serviceAccount from '../credentials/tot-poc-firebase-adminsdk-aaij3-9bbecf3f9a.json';

// Initialisez Firebase Admin SDK avec les credentials par défaut
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: 'tot-poc'  // Remplacez par l'ID de votre projet Firebase
});

const firestore = admin.firestore();

// Votre logique pour initialiser les collections, par exemple avec le batch
async function initializeSkillsAndClasses() {
    const batch = firestore.batch();

    // Exemples de documents à ajouter
    const skills = [
        {
            skillId: "punch",
            name: "Coup de poing",
            type: "active",
            description: "Assène un coup de poing à un ennemi, infligeant des dégâts physiques.",
            effect: {
                damage: 10,
                cooldown: 5
            }
        },
        // Ajoutez d'autres compétences ici
    ];

    const classes = [
        {
            classId: "token_vagabond",
            name: "Token Vagabond",
            description: "Le Token Vagabond est un aventurier novice qui commence son périple dans le monde fantastique des crypto-monnaies.",
            startingAttributes: {
                health: 100,
                attack: 10,
                defense: 5,
                speed: 1.0,
                criticalChance: 0.05
            },
            skills: [{ skillId: "punch" }],
            evolutionPaths: [
                { level: 10, classId: "archer", name: "Archer" },
                { level: 10, classId: "mage", name: "Mage" },
                { level: 10, classId: "warrior", name: "Guerrier" }
            ]
        },
        // Ajoutez d'autres classes ici
    ];

    // Ajoutez les compétences à Firestore avec le batch
    skills.forEach(skill => {
        const skillRef = firestore.collection('skills').doc(skill.skillId);
        batch.set(skillRef, skill);
    });

    // Ajoutez les classes à Firestore avec le batch
    classes.forEach(cls => {
        const classRef = firestore.collection('classes').doc(cls.classId);
        batch.set(classRef, cls);
    });

    await batch.commit();
    console.log('Skills et classes initialisés.');
}

// Exécuter la fonction d'initialisation
initializeSkillsAndClasses()
    .then(() => {
        console.log('Initialisation terminée avec succès.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Erreur lors de l\'initialisation des données:', error);
        process.exit(1);
    });
