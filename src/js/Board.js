export default class Board {
  constructor() {
    this.graphCells = {};
    this.genBoard();
  }

  genBoard() {
    const obj = {};
    let z = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        obj[z] = [i, j];
        z++;
      }
    }
    this.graphCells = obj;
  }

  getIdx(arr) {
    let currKey;
    for (const key in this.graphCells) {
      if (
        this.graphCells[key][0] === arr[0]
        && this.graphCells[key][1] === arr[1]
      ) {
        currKey = +key;
      }
    }
    return currKey;
  }

  getRange(idx, rangeValue) {
    const range = [];
    const from = -Math.abs(rangeValue);
    const coords = {
      x: this.graphCells[idx][0],
      y: this.graphCells[idx][1],
    };
    for (let y = from; y <= rangeValue; y++) {
      for (let x = from; x <= rangeValue; x++) {
        range.push([coords.x + x, coords.y + y]);
      }
    }
    for (let i = range.length - 1; i >= 0; i--) {
      if (range[i][0] === coords.x && range[i][1] === coords.y) {
        range.splice(i, 1);
        break;
      }
      if (range[i][0] < 0 || range[i][0] > 7) {
        range.splice(i, 1);
        break;
      }
      if (range[i][1] < 0 || range[i][1] > 7) {
        range.splice(i, 1);
      }
    }
    const rangeIdxs = [];
    range.forEach((item) => {
      const index = this.getIdx(item);
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!index) rangeIdxs.push(index);
    });
    return rangeIdxs;
  }
}
