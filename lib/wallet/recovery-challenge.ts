export type RecoveryWordPositions = readonly [number, number, number];

/** Select once per new phrase; rerenders and Back never redraw the positions. */
export function createRecoveryChallenge(wordCount = 24): RecoveryWordPositions {
  if (!Number.isSafeInteger(wordCount) || wordCount < 3 || wordCount > 24) throw new Error('Unsupported recovery phrase length.');
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness is unavailable. Open Qozmo over HTTPS in an updated browser.');
  const pool = Array.from({ length: wordCount }, (_, index) => index);
  const random = new Uint32Array(1);
  for (let index = 0; index < 3; index++) {
    const remaining = wordCount - index;
    const limit = Math.floor(2 ** 32 / remaining) * remaining;
    // Rejection sampling avoids modulo bias. Partial Fisher–Yates prevents duplicates.
    do { crypto.getRandomValues(random); } while (random[0] >= limit);
    const selected = index + random[0] % remaining;
    [pool[index], pool[selected]] = [pool[selected], pool[index]];
  }
  const positions: [number, number, number] = [pool[0], pool[1], pool[2]];
  positions.sort((a, b) => a - b);
  return Object.freeze(positions);
}

/** Missing or malformed challenges must never pass an empty-array comparison. */
export function recoveryAnswersMatch(phrase: string, positions: RecoveryWordPositions | null, answers: readonly string[]): boolean {
  const words = phrase.trim().toLowerCase().split(/\s+/);
  if (!positions || positions.length !== 3 || new Set(positions).size !== 3 || answers.length !== 3 || words.length < 3) return false;
  if (positions.some(index => !Number.isSafeInteger(index) || index < 0 || index >= words.length)) return false;
  return positions.every((position, index) => typeof answers[index] === 'string' && !!answers[index].trim() && answers[index].trim().toLowerCase() === words[position]);
}
