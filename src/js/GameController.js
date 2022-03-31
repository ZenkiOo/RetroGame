import themes from './themes';
import Team from './Team';
import { generateTeam } from './generators';
import Board from './Board';
import Bowman from './Characters/Bowman';
import Swordsman from './Characters/Swordsman';
import Magician from './Characters/Magician';
import Daemon from './Characters/Daemon';
import Undead from './Characters/Undead';
import Vampire from './Characters/Vampire';
import PositionedCharacter from './PositionedCharacter';
import GameState from './GameState';
import GamePlay from './GamePlay';
import cursors from './cursors';
import './vendor/astar';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.userChars = [Bowman, Swordsman, Magician];
    this.botChars = [Daemon, Undead, Vampire];
    this.userTeam = new Team();
    this.botTeam = new Team();
    this.gameState = new GameState();
    this.board = new Board();
  }

  init() {
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.userTeam.addAll(generateTeam(this.userChars, 1, 2));
    this.botTeam.addAll(generateTeam(this.botChars, 1, 2));
    this.addCharsToBoard(this.userTeam, this.getUserStartPositions());
    this.addCharsToBoard(this.botTeam, this.getBotStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
  }

  onCellClick(index) {
    if (this.gameState.level === 5 || this.userTeam.members.size === 0) {
      return;
    }
    if (this.gameState.selected !== null && this.getChar(index) && this.isBotChar(index)) {
      if (this.isAttack(index)) {
        this.getAttack(index, this.gameState.selected);
      }
    }
    if (this.gameState.selected !== null && this.isValidMove(index) && !this.getChar(index)) {
      if (this.gameState.isUsersTurn) {
        this.getUsersTurn(index);
      }
    }
    if (this.gameState.selected !== null && !this.isValidMove(index) && !this.isAttack(index)) {
      if (this.gameState.isUsersTurn && !this.getChar(index)) {
        GamePlay.showError('Недопустимый ход');
      }
    }
    if (!this.getChar(index)) {
      return;
    }
    if (this.getChar(index) && this.isBotChar(index) && !this.isAttack(index)) {
      GamePlay.showError('Это не ваш персонаж');
    }
    if (this.getChar(index) && this.isUserChar(index)) {
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
      this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-yellow'));
      this.gamePlay.selectCell(index);
      this.gameState.selected = index;
    }
  }

  onCellEnter(index) {
    if (this.getChar(index) && this.isUserChar(index)) {
      this.gamePlay.setCursor(cursors.pointer);
    }
    if (this.gameState.selected !== null && !this.getChar(index) && this.isValidMove(index)) {
      this.gamePlay.setCursor(cursors.pointer);
      this.gamePlay.selectCell(index, 'green');
    }
    if (this.getChar(index)) {
      const char = this.getChar(index).character;
      const message = `\u{1F396}${char.level}\u{2694}${char.attack}\u{1F6E1}${char.defence}\u{2764}${char.health}`;
      this.gamePlay.showCellTooltip(message, index);
    }
    if (this.gameState.selected !== null && this.getChar(index) && !this.isUserChar(index)) {
      if (this.isAttack(index)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.selectCell(index, 'red');
      }
    }
    if (this.gameState.selected !== null && !this.isAttack(index) && !this.isValidMove(index)) {
      if (!this.isUserChar(index)) {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-red'));
    this.gamePlay.cells.forEach((elem) => elem.classList.remove('selected-green'));
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor(cursors.auto);
  }

  getAttack(idx) {
    if (this.gameState.isUsersTurn) {
      const attacker = this.getChar(this.gameState.selected).character;
      const target = this.getChar(idx).character;
      const damage = Math.max(attacker.attack - target.defence, attacker.attack * 0.1);
      if (!attacker || !target) {
        return;
      }
      this.gamePlay.showDamage(idx, damage.toFixed(1)).then(() => {
        target.health -= damage;
        if (target.health <= 0) {
          this.removeChar(idx);
          this.botTeam.delete(target);
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
      }).then(() => {
        this.checkLevel();
        this.aiResponse();
      });
      this.gameState.isUsersTurn = false;
    }
  }

  getUsersTurn(idx) {
    this.getSelectedChar().position = idx;
    this.gamePlay.deselectCell(this.gameState.selected);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    this.gameState.selected = idx;
    this.gameState.isUsersTurn = false;
    this.aiResponse();
  }

  stepsToTarget(activeChar, target) {
    const botsTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Vampire
      || e.character instanceof Daemon
      || e.character instanceof Undead
    ));
    const usersTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Bowman
      || e.character instanceof Swordsman
      || e.character instanceof Magician
    ));
    const tdArr = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ];
    [...usersTeam, ...botsTeam].forEach((char) => {
      const charCoords = this.board.graphCells[char.position];
      tdArr[charCoords[0]][charCoords[1]] = 0;
    });
    tdArr[target[0]][target[1]] = 1;
    // eslint-disable-next-line no-undef
    const graphDiagonal = new Graph(tdArr, { diagonal: true });
    const charCoords = this.board.graphCells[activeChar.position];
    const start = graphDiagonal.grid[charCoords[0]][charCoords[1]];
    const end = graphDiagonal.grid[target[0]][target[1]];
    // eslint-disable-next-line no-undef
    const resultWithDiagonals = astar.search(graphDiagonal, start, end, {
      // eslint-disable-next-line no-undef
      heuristic: astar.heuristics.diagonal,
    });
    const steps = [];
    resultWithDiagonals.forEach((coord) => {
      steps.push([coord.x, coord.y]);
    });
    return steps;
  }

  findTarget(activeChar) {
    const usersTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Bowman
      || e.character instanceof Swordsman
      || e.character instanceof Magician
    ));
    const targetsCoords = [];
    usersTeam.forEach((char) => {
      const { position } = char;
      targetsCoords.push([...this.board.graphCells[position], position]);
    });
    const waysToTargets = [];
    targetsCoords.forEach((target) => {
      waysToTargets.push(this.stepsToTarget(activeChar, target));
    });
    const wayToClosestTarget = waysToTargets.reduce((acc, loc) => {
      if (acc.length < loc.length) return acc;
      return loc;
    });
    return this.board.getIdx(wayToClosestTarget[wayToClosestTarget.length - 2]);
  }

  aiResponse() {
    if (this.gameState.isUsersTurn) {
      return;
    }
    const botsTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Vampire
      || e.character instanceof Daemon
      || e.character instanceof Undead
    ));
    const usersTeam = this.gameState.allPositions.filter((e) => (
      e.character instanceof Bowman
      || e.character instanceof Swordsman
      || e.character instanceof Magician
    ));
    let bot = null;
    let target = null;

    if (botsTeam.length === 0 || usersTeam.length === 0) {
      return;
    }

    botsTeam.forEach((elem) => {
      const rangeAttack = this.board.getRange(elem.position, elem.character.attackRange);
      usersTeam.forEach((val) => {
        if (rangeAttack.includes(val.position)) {
          bot = elem;
          target = val;
        }
      });
    });

    if (target) {
      const damage = Math.max(
        bot.character.attack - target.character.defence, bot.character.attack * 0.1,
      );
      this.gamePlay.showDamage(target.position, damage.toFixed(1)).then(() => {
        target.character.health -= damage;
        if (target.character.health <= 0) {
          this.removeChar(target.position);
          this.userTeam.delete(target.character);
          this.gamePlay.deselectCell(this.gameState.selected);
          this.gameState.selected = null;
        }
      }).then(() => {
        this.gamePlay.redrawPositions(this.gameState.allPositions);
        this.gameState.isUsersTurn = true;
      }).then(() => {
        this.checkLevel();
      });
    } else {
      bot = botsTeam[Math.floor(Math.random() * botsTeam.length)];
      const botRange = this.board.getRange(bot.position, bot.character.distance);
      botRange.forEach((e) => {
        this.gameState.allPositions.forEach((i) => {
          if (e === i.position) {
            botRange.splice(botRange.indexOf(i.position), 1);
          }
        });
      });
      const botPos = this.findTarget(bot);
      bot.position = botPos;
      this.gamePlay.redrawPositions(this.gameState.allPositions);
      this.gameState.isUsersTurn = true;
    }
  }

  checkLevel() {
    if (this.userTeam.members.size === 0) {
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`Поражение. Набранные очки: ${this.gameState.points}`);
    }
    if (this.botTeam.members.size === 0 && this.gameState.level === 4) {
      this.getScore();
      this.gameState.statistics.push(this.gameState.points);
      GamePlay.showMessage(`Победа! Набранные очки: ${this.gameState.points},
      Максимальное количество очков: ${Math.max(...this.gameState.statistics)}`);
      this.gameState.level += 1;
    }
    if (this.botTeam.members.size === 0 && this.gameState.level <= 3) {
      this.gameState.isUsersTurn = true;
      this.getScore();
      GamePlay.showMessage(`Уровень ${this.gameState.level} завершен. Набранные очки: ${this.gameState.points}`);
      this.gameState.level += 1;
      this.getLevelUp();
    }
  }

  getLevelUp() {
    this.gameState.allPositions = [];
    this.userTeam.members.forEach((char) => char.levelUp());
    if (this.gameState.level === 2) {
      this.userTeam.addAll(generateTeam(this.userChars, 1, 1));
      this.botTeam.addAll(generateTeam(this.botChars, 2, this.userTeam.members.size));
    }
    if (this.gameState.level === 3) {
      this.userTeam.addAll(generateTeam(this.userChars, 2, 2));
      this.botTeam.addAll(generateTeam(this.botChars, 3, this.userTeam.members.size));
    }
    if (this.gameState.level === 4) {
      this.userTeam.addAll(generateTeam(this.userChars, 3, 2));
      this.botTeam.addAll(generateTeam(this.botChars, 4, this.userTeam.members.size));
    }
    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.addCharsToBoard(this.userTeam, this.getUserStartPositions());
    this.addCharsToBoard(this.botTeam, this.getBotStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }

  getScore() {
    this.gameState.points += this.userTeam.toArray().reduce((a, b) => a + b.health, 0);
  }

  removeChar(idx) {
    const state = this.gameState.allPositions;
    state.splice(state.indexOf(this.getChar(idx)), 1);
  }

  isValidMove(idx) {
    if (this.getSelectedChar()) {
      const moving = this.getSelectedChar().character.distance;
      const arr = this.board.getRange(this.gameState.selected, moving);
      return arr.includes(idx);
    }
    return false;
  }

  isAttack(idx) {
    if (this.getSelectedChar()) {
      const stroke = this.getSelectedChar().character.attackRange;
      const arr = this.board.getRange(this.gameState.selected, stroke);
      return arr.includes(idx);
    }
    return false;
  }

  getSelectedChar() {
    return this.gameState.allPositions.find((elem) => elem.position === this.gameState.selected);
  }

  getUserStartPositions() {
    const size = this.gamePlay.boardSize;
    const userPositions = [];
    for (let i = 0, j = 1; userPositions.length < size * 2; i += size, j += size) {
      userPositions.push(i, j);
    }
    return userPositions;
  }

  getBotStartPositions() {
    const size = this.gamePlay.boardSize;
    const botPositions = [];
    for (let i = size - 2, j = size - 1; botPositions.length < size * 2; i += size, j += size) {
      botPositions.push(i, j);
    }
    return botPositions;
  }

  getRandom(positions) {
    this.positions = positions;
    return this.positions[Math.floor(Math.random() * this.positions.length)];
  }

  addCharsToBoard(team, positions) {
    const posArr = [...positions];
    for (const item of team) {
      const random = this.getRandom(posArr);
      this.gameState.allPositions.push(new PositionedCharacter(item, random));
      posArr.splice(posArr.indexOf(random), 1);
    }
  }

  isUserChar(idx) {
    if (this.getChar(idx)) {
      const char = this.getChar(idx).character;
      return this.userChars.some((elem) => char instanceof elem);
    }
    return false;
  }

  isBotChar(idx) {
    if (this.getChar(idx)) {
      const bot = this.getChar(idx).character;
      return this.botChars.some((elem) => bot instanceof elem);
    }
    return false;
  }

  getChar(idx) {
    return this.gameState.allPositions.find((elem) => elem.position === idx);
  }

  onNewGameClick() {
    this.userTeam = new Team();
    this.botTeam = new Team();
    this.botChars = [Daemon, Undead, Vampire];
    this.userChars = [Bowman, Swordsman, Magician];
    this.gameState.selected = null;
    this.gameState.level = 1;
    this.gameState.points = 0;
    this.gameState.allPositions = [];
    this.gameState.isUsersTurn = true;
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.userTeam.addAll(generateTeam([Bowman, Swordsman], 1, 2));
    this.botTeam.addAll(generateTeam(this.botChars, 1, 2));
    this.addCharsToBoard(this.userTeam, this.getUserStartPositions());
    this.addCharsToBoard(this.botTeam, this.getBotStartPositions());
    this.gamePlay.redrawPositions(this.gameState.allPositions);
    GamePlay.showMessage(`Уровень ${this.gameState.level}`);
  }

  onSaveGameClick() {
    this.stateService.save(GameState.from(this.gameState));
    GamePlay.showMessage('Игра сохранена');
  }

  onLoadGameClick() {
    GamePlay.showMessage('Игра загружается');
    const load = this.stateService.load();
    if (!load) {
      GamePlay.showError('Ошибка загрузки');
    }
    this.gameState.isUsersTurn = load.isUsersTurn;
    this.gameState.level = load.level;
    this.gameState.allPositions = [];
    this.gameState.points = load.points;
    this.gameState.statistics = load.statistics;
    this.gameState.selected = load.selected;
    this.userTeam = new Team();
    this.botTeam = new Team();
    load.allPositions.forEach((elem) => {
      let char;
      switch (elem.character.type) {
        case 'swordsman':
          char = new Swordsman(elem.character.level);
          this.userTeam.addAll([char]);
          break;
        case 'bowman':
          char = new Bowman(elem.character.level);
          this.userTeam.addAll([char]);
          break;
        case 'magician':
          char = new Magician(elem.character.level);
          this.userTeam.addAll([char]);
          break;
        case 'undead':
          char = new Undead(elem.character.level);
          this.botTeam.addAll([char]);
          break;
        case 'vampire':
          char = new Vampire(elem.character.level);
          this.botTeam.addAll([char]);
          break;
        case 'daemon':
          char = new Daemon(elem.character.level);
          this.botTeam.addAll([char]);
          break;
        // no default
      }
      char.health = elem.character.health;
      this.gameState.allPositions.push(new PositionedCharacter(char, elem.position));
    });
    this.gamePlay.drawUi(themes[this.gameState.level]);
    this.gamePlay.redrawPositions(this.gameState.allPositions);
  }
}
