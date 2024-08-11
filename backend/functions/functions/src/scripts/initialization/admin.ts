import * as fs from 'fs';
import * as path from 'path';
import { select, confirm } from '@inquirer/prompts';

interface Skill {
    skillId: string;
    name: string;
    type: 'active' | 'passive';
    description: string;
    effect: {
        damage?: number;
        cooldown?: number;
        [key: string]: any;
    };
}

interface Class {
    classId: string;
    name: string;
    description: string;
    startingAttributes: {
        health: number;
        attack: number;
        defense: number;
        speed: number;
        criticalChance: number;
    };
    skills: { skillId: string }[];
    evolutionPaths: { level: number; classId: string; name: string }[];
}

/**
 * Fonction pour lire un fichier JSON.
 */
function readJsonFile(filePath: string): any {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

/**
 * Fonction pour écrire dans un fichier JSON.
 */
function writeJsonFile(filePath: string, data: any): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Fichier '${filePath}' mis à jour.`);
}

/**
 * Lister les fichiers disponibles dans un répertoire.
 */
function listJsonFiles(directoryPath: string): string[] {
    return fs.readdirSync(directoryPath)
        .filter(file => path.extname(file) === '.json')
        .map(file => path.basename(file, '.json'));
}

/**
 * Fonction pour créer ou mettre à jour une classe.
 */
async function createOrUpdateClass(): Promise<void> {
    const classesDir = path.join(__dirname, './classes');
    const classFiles = listJsonFiles(classesDir).map(file => ({ name: file, value: file }));

    const classId = await select({
        message: 'Choisissez la classe à modifier ou créer:',
        choices: [...classFiles, { name: 'Créer une nouvelle classe', value: 'new' }]
    });

    let classData: Class;
    const classFilePath = classId === 'new' ?
        path.join(classesDir, `nouvelle_classe.json`) :
        path.join(classesDir, `${classId}.json`);

    if (classId === 'new') {
        // Créer une nouvelle classe
        classData = {
            classId: 'nouvelle_classe',
            name: 'Nouvelle Classe',
            description: 'Description de la nouvelle classe',
            startingAttributes: {
                health: 100,
                attack: 10,
                defense: 5,
                speed: 10,
                criticalChance: 5,
            },
            skills: [],
            evolutionPaths: [],
        };
    } else {
        classData = readJsonFile(classFilePath) as Class;
    }

    const manageSkills = await confirm({
        message: 'Souhaitez-vous gérer les compétences associées à cette classe?',
        default: false
    });

    if (manageSkills) {
        classData = await manageClassSkills(classData);
    }

    writeJsonFile(classFilePath, classData);
}

/**
 * Fonction pour supprimer une classe.
 */
async function deleteClass(): Promise<void> {
    const classesDir = path.join(__dirname, './classes');
    const classFiles = listJsonFiles(classesDir).map(file => ({ name: file, value: file }));

    const classIdToDelete = await select({
        message: 'Choisissez la classe à supprimer:',
        choices: classFiles
    });

    const filePath = path.join(classesDir, `${classIdToDelete}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Classe '${classIdToDelete}' supprimée.`);
    } else {
        console.error(`Classe '${classIdToDelete}' non trouvée.`);
    }
}

/**
 * Fonction pour créer ou mettre à jour une compétence.
 */
async function createOrUpdateSkill(): Promise<void> {
    const skillsDir = path.join(__dirname, './skills');
    const skillFiles = listJsonFiles(skillsDir).map(file => ({ name: file, value: file }));

    const skillId = await select({
        message: 'Choisissez la compétence à modifier ou créer:',
        choices: [...skillFiles, { name: 'Créer une nouvelle compétence', value: 'new' }]
    });

    const skillFilePath = skillId === 'new' ?
        path.join(skillsDir, `nouvelle_competence.json`) :
        path.join(skillsDir, `${skillId}.json`);

    let skillData: Skill;
    if (skillId === 'new') {
        // Créer une nouvelle compétence
        skillData = {
            skillId: 'nouvelle_competence',
            name: 'Nouvelle Compétence',
            type: 'active',
            description: 'Description de la nouvelle compétence',
            effect: {
                damage: 10,
                cooldown: 5,
            },
        };
    } else {
        skillData = readJsonFile(skillFilePath) as Skill;
    }

    writeJsonFile(skillFilePath, skillData);
}

/**
 * Fonction pour supprimer une compétence.
 */
async function deleteSkill(): Promise<void> {
    const skillsDir = path.join(__dirname, './skills');
    const skillFiles = listJsonFiles(skillsDir).map(file => ({ name: file, value: file }));

    const skillIdToDelete = await select({
        message: 'Choisissez la compétence à supprimer:',
        choices: skillFiles
    });

    const filePath = path.join(skillsDir, `${skillIdToDelete}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Compétence '${skillIdToDelete}' supprimée.`);
    } else {
        console.error(`Compétence '${skillIdToDelete}' non trouvée.`);
    }
}

/**
 * Fonction pour gérer les compétences d'une classe.
 */
async function manageClassSkills(classData: Class): Promise<Class> {
    let continueManaging = true;

    while (continueManaging) {
        const action = await select({
            message: 'Que voulez-vous faire avec les compétences de cette classe?',
            choices: [
                { name: 'Ajouter une compétence', value: 'add' },
                { name: 'Supprimer une compétence', value: 'remove' },
                { name: 'Terminer la gestion des compétences', value: 'finish' }
            ]
        });

        switch (action) {
            case 'add':
                const skillsDir = path.join(__dirname, './skills');
                const skillFiles = listJsonFiles(skillsDir).map(file => ({ name: file, value: file }));

                const skillIdToAdd = await select({
                    message: 'Choisissez une compétence à ajouter:',
                    choices: skillFiles
                });

                classData.skills.push({ skillId: skillIdToAdd });
                console.log(`Compétence '${skillIdToAdd}' ajoutée à la classe '${classData.classId}'.`);
                break;

            case 'remove':
                const skillIdToRemove = await select({
                    message: 'Choisissez la compétence à supprimer:',
                    choices: classData.skills.map(skill => ({ name: skill.skillId, value: skill.skillId }))
                });

                classData.skills = classData.skills.filter(skill => skill.skillId !== skillIdToRemove);
                console.log(`Compétence '${skillIdToRemove}' supprimée de la classe '${classData.classId}'.`);
                break;

            case 'finish':
                continueManaging = false;
                break;
        }
    }

    return classData;
}

/**
 * Fonction pour consulter le détail d'une classe.
 */
function viewClassDetails(): void {
    const classesDir = path.join(__dirname, './classes');
    const classFiles = fs.readdirSync(classesDir);

    classFiles.forEach(file => {
        const classData = readJsonFile(path.join(classesDir, file));
        console.log(`\nClasse: ${classData.name}`);
        console.log(`Description: ${classData.description}`);
        console.log('Attributs de départ:', classData.startingAttributes);
        console.log('Compétences associées:', classData.skills.map((skill: { skillId: string }) => skill.skillId).join(', '));
        console.log('Chemins d\'évolution:', classData.evolutionPaths.map((path: { name: string; level: number }) => `${path.name} (Niveau ${path.level})`).join(', '));
    });
}

/**
 * Fonction pour consulter le détail d'une compétence.
 */
function viewSkillDetails(): void {
    const skillsDir = path.join(__dirname, './skills');
    const skillFiles = fs.readdirSync(skillsDir);

    skillFiles.forEach(file => {
        const skillData = readJsonFile(path.join(skillsDir, file));
        console.log(`\nCompétence: ${skillData.name}`);
        console.log(`Type: ${skillData.type}`);
        console.log(`Description: ${skillData.description}`);
        console.log('Effets:', skillData.effect);
    });
}

/**
 * Script interactif principal
 */
async function runInteractiveScript(): Promise<void> {
    const action = await select({
        message: 'Que voulez-vous faire?',
        choices: [
            { name: 'Créer ou mettre à jour une classe', value: 'createOrUpdateClass' },
            { name: 'Supprimer une classe', value: 'deleteClass' },
            { name: 'Créer ou mettre à jour une compétence', value: 'createOrUpdateSkill' },
            { name: 'Supprimer une compétence', value: 'deleteSkill' },
            { name: 'Consulter le détail des classes', value: 'viewClassDetails' },
            { name: 'Consulter le détail des compétences', value: 'viewSkillDetails' },
            { name: 'Quitter', value: 'quit' }
        ]
    });

    switch (action) {
        case 'createOrUpdateClass':
            await createOrUpdateClass();
            break;

        case 'deleteClass':
            await deleteClass();
            break;

        case 'createOrUpdateSkill':
            await createOrUpdateSkill();
            break;

        case 'deleteSkill':
            await deleteSkill();
            break;

        case 'viewClassDetails':
            viewClassDetails();
            break;

        case 'viewSkillDetails':
            viewSkillDetails();
            break;

        case 'quit':
            console.log('Au revoir!');
            process.exit(0);
            break;

        default:
            console.error('Action non reconnue.');
            break;
    }

    // Relancer le script après chaque action pour permettre d'autres modifications
    await runInteractiveScript();
}

// Exécuter le script interactif
runInteractiveScript().catch(error => {
    console.error('Erreur lors de l\'exécution du script interactif:', error);
});
