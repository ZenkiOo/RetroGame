export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    if (new.target === Character) {
      throw new Error('It is forbidden to create objects of the Character class');
    }
  }

  levelUp() {
    const attackAfter = Math.max(this.attack, (this.attack * (80 + this.health)) / 100);
    const defenceAfter = Math.max(this.defence, (this.defence * (80 + this.health)) / 100);
    const healthAfter = this.health + 80 > 100 ? 100 : this.health + 80;

    this.attack = attackAfter;
    this.defence = defenceAfter;
    this.health = healthAfter;
    this.level += 1;
  }
}
