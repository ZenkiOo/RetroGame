export function calcTileType(index, boardSize) {
  // TODO: write logic here
  const board = [
    'top-left', ...Array(boardSize - 2).fill('top'), 'top-right',
    ...Array(boardSize - 2).fill(['left', ...Array(boardSize - 2).fill('center'), 'right']),
    'bottom-left', ...Array(boardSize - 2).fill('bottom'), 'bottom-right',
  ].flat();
  return board[index];
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
