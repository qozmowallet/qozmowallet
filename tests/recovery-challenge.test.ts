import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRecoveryChallenge, recoveryAnswersMatch, type RecoveryWordPositions } from '../lib/wallet/recovery-challenge';

test('recovery challenges use three unique sorted positions and redraw for a new phrase', t => {
  const stream = [0, 0, 0, 0, 0, 21];
  t.mock.method(crypto, 'getRandomValues', <T extends ArrayBufferView>(target: T): T => {
    assert.ok(target instanceof Uint32Array);
    target[0] = stream.shift()!;
    return target;
  });
  const first = createRecoveryChallenge();
  const second = createRecoveryChallenge();
  assert.deepEqual(first, [0, 1, 2]);
  assert.deepEqual(second, [0, 1, 23]);
  assert.ok(Object.isFrozen(first));
  assert.equal(new Set(second).size, 3);
});

test('recovery sampling rejects biased values rather than mapping them into a position', t => {
  const stream = [0xffffffff, 0, 0, 0];
  const random = t.mock.method(crypto, 'getRandomValues', <T extends ArrayBufferView>(target: T): T => {
    assert.ok(target instanceof Uint32Array);
    target[0] = stream.shift()!;
    return target;
  });
  assert.deepEqual(createRecoveryChallenge(24), [0, 1, 2]);
  assert.equal(random.mock.callCount(), 4);
  for (const length of [2, 25, 3.5, NaN, Infinity]) assert.throws(() => createRecoveryChallenge(length), /length/);
});

test('confirmation matches the selected words and fails closed on missing or malformed challenges', () => {
  const phrase = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
  const positions: RecoveryWordPositions = [0, 4, 11];
  assert.equal(recoveryAnswersMatch(phrase, positions, [' Legal ', 'WAVE', ' yellow ']), true);
  assert.equal(recoveryAnswersMatch(phrase, positions, ['winner', 'wave', 'yellow']), false);
  assert.equal(recoveryAnswersMatch(phrase, positions, ['', 'wave', 'yellow']), false);
  assert.equal(recoveryAnswersMatch(phrase, positions, ['legal', 'wave']), false);
  for (const malformed of [null, [], [0, 0, 11], [-1, 4, 11], [0, 4, 12], [0, 4.5, 11]]) {
    assert.equal(recoveryAnswersMatch(phrase, malformed as RecoveryWordPositions | null, ['legal', 'wave', 'yellow']), false);
  }
});

test('challenge creation has no insecure randomness fallback', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  try {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    assert.throws(() => createRecoveryChallenge(), /Secure randomness/);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor); else Reflect.deleteProperty(globalThis, 'crypto');
  }
});
