import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCommand, completeCommand } from '../src/terminal-commands.js';
test('terminal handles case, whitespace, aliases, and returning to the regular view', () => {
  assert.deepEqual(resolveCommand(' WHOAMI '), {type:'about'});
  assert.deepEqual(resolveCommand('research'), {type:'research'});
  assert.deepEqual(resolveCommand('exit'), {type:'regular'});
  assert.deepEqual(resolveCommand('  '), {type:'empty'});
});
test('terminal only accepts known commands and completes unambiguous prefixes', () => {
  assert.equal(resolveCommand('<script>alert(1)</script>').type, 'unknown');
  assert.equal(resolveCommand('research; rm -rf /').type, 'unknown');
  assert.deepEqual(completeCommand('ex'), ['experience']);
  assert.deepEqual(completeCommand('re'), ['research','regular']);
  assert.deepEqual(completeCommand(''), []);
});
