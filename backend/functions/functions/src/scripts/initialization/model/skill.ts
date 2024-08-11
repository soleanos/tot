export interface Skill {
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
