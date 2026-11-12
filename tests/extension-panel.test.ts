import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const workerSource = readFile(new URL('../extension/background.js', import.meta.url), 'utf8');

async function panelWorker(fail = false) {
  const configured: unknown[] = [];
  const warnings: string[] = [];
  const events: Record<string, () => Promise<void>> = {};
  const restricted = (members: Record<string, unknown>) => new Proxy(members, {
    get(target, key) {
      assert.ok(Object.hasOwn(target, key), `The UI worker accessed an unexpected API: ${String(key)}`);
      return target[key as string];
    },
  });
  runInNewContext(await workerSource, {
    chrome: restricted({
      sidePanel: restricted({ setPanelBehavior: async (options: unknown) => {
        configured.push(JSON.parse(JSON.stringify(options)));
        if (fail) throw new Error('Internal failure with private implementation details');
      } }),
      runtime: restricted(Object.fromEntries(['onInstalled', 'onStartup'].map(event => [event, {
        addListener(listener: () => Promise<void>) { events[event] = listener; },
      }]))),
    }),
    console: { warn(message: string) { warnings.push(message); } },
  });
  await new Promise(resolve => setImmediate(resolve));
  return { configured, warnings, events };
}

test('panel worker restores toolbar behavior on load, browser startup and extension update using only UI APIs', async () => {
  const worker = await panelWorker();
  assert.deepEqual(worker.configured, [{ openPanelOnActionClick: true }]);
  await worker.events.onStartup();
  await worker.events.onInstalled();
  assert.equal(worker.configured.length, 3);
  assert.ok(worker.configured.every(options => JSON.stringify(options) === '{"openPanelOnActionClick":true}'));
  assert.deepEqual(worker.warnings, []);
});

test('a panel configuration failure is handled without opening another window or exposing the API error', async () => {
  const worker = await panelWorker(true);
  await worker.events.onInstalled();
  assert.equal(worker.warnings.length, 2);
  assert.ok(worker.warnings.every(message => message.includes('Reload the extension') && !message.includes('private')));
});
