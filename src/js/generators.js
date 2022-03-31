/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const tipe = Math.floor(Math.random() * allowedTypes.length);
    const level = Math.floor(Math.random() * maxLevel) + 1;
    yield new allowedTypes[tipe](level);
  }
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const team = [];
  const character = characterGenerator(allowedTypes, maxLevel);
  while (team.length < characterCount) {
    team.push(character.next().value);
  }
  return team;
}
