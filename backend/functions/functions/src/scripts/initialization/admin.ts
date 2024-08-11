import * as fs from 'fs';
import * as path from 'path';
import { input, select, confirm } from '@inquirer/prompts';
import { Class } from './model/class'; // Chemin correct
import { Skill } from './model/skill'; // Chemin correct

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
        // Demander les détails de la nouvelle classe
        const className = await input({ message: 'Entrez le nom de la classe:' });
        const classDescription = await input({ message: 'Entrez la description de la classe:' });
        const health = await input({ message: 'Entrez la valeur de santé de départ:', default: '100' });
        const attack = await input({ message: 'Entrez la valeur d\'attaque de départ:', default: '10' });
        const defense = await input({ message: 'Entrez la valeur de défense de départ:', default: '5' });
        const speed = await input({ message: 'Entrez la vitesse de départ:', default: '10' });
        const criticalChance = await input({ message: 'Entrez le pourcentage de coup critique de départ:', default: '5' });

        classData = {
            classId: className.toLowerCase().replace(/\s+/g, '_'),
            name: className,
            description: classDescription,
            startingAttributes: {
                health: parseInt(health, 10),
                attack: parseInt(attack, 10),
                defense: parseInt(defense, 10),
                speed: parseInt(speed, 10),
                criticalChance: parseInt(criticalChance, 10),
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
        // Demander les détails de la nouvelle compétence
        const skillName = await input({ message: 'Entrez le nom de la compétence:' });
        const skillDescription = await input({ message: 'Entrez la description de la compétence:' });
        const skillType = await select<'active' | 'passive'>({
            message: 'Choisissez le type de compétence:',
            choices: [
                { name: 'Active', value: 'active' },
                { name: 'Passive', value: 'passive' }
            ]
        });
        const damage = await input({ message: 'Entrez les dégâts de la compétence:', default: '10' });
        const cooldown = await input({ message: 'Entrez le temps de recharge de la compétence (en secondes):', default: '5' });

        skillData = {
            skillId: skillName.toLowerCase().replace(/\s+/g, '_'),
            name: skillName,
            type: skillType,
            description: skillDescription,
            effect: {
                damage: parseInt(damage, 10),
                cooldown: parseInt(cooldown, 10),
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
                    choices: classData.skills.map((skill) => ({ name: skill.skillId, value: skill.skillId }))
                });

                classData.skills = classData.skills.filter((skill) => skill.skillId !== skillIdToRemove);
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
        const classData = readJsonFile(path.join(classesDir, file)) as Class;
        console.log(`\nClasse: ${classData.name}`);
        console.log(`Description: ${classData.description}`);
        console.log('Attributs de départ:', classData.startingAttributes);
        console.log('Compétences associées:', classData.skills.map(skill => skill.skillId).join(', '));
        console.log('Chemins d\'évolution:', classData.evolutionPaths.map((path: { name: any; level: any; }) => `${path.name} (Niveau ${path.level})`).join(', '));
    });
}

/**
 * Fonction pour consulter le détail d'une compétence.
 */
function viewSkillDetails(): void {
    const skillsDir = path.join(__dirname, './skills');
    const skillFiles = fs.readdirSync(skillsDir);

    skillFiles.forEach(file => {
        const skillData = readJsonFile(path.join(skillsDir, file)) as Skill;
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
