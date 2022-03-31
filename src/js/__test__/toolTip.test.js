import Daemon from '../Characters/Daemon';
import Vampire from '../Characters/Vampire';

test('Всплывающая подсказка', () => {
  const daemon = new Daemon(1);
  const received = `\u{1F396}${daemon.level}\u{2694}${daemon.attack}\u{1F6E1}${daemon.defence}\u{2764}${daemon.health}`;
  const expected = '\u{1F396}1\u{2694}10\u{1F6E1}40\u{2764}50';
  expect(received).toEqual(expected);
});

test('Всплывающая подсказка', () => {
  const vampire = new Vampire(1);
  const received = `\u{1F396}${vampire.level}\u{2694}${vampire.attack}\u{1F6E1}${vampire.defence}\u{2764}${vampire.health}`;
  const expected = '\u{1F396}1\u{2694}25\u{1F6E1}25\u{2764}50';
  expect(received).toEqual(expected);
});
