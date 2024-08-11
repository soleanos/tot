export interface Class {
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
