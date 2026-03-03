/**
 * In-browser Lua 5.1 runner using Wasmoon (WASM).
 * Captures print() output and returns { output: string[], error?: string }.
 * Each run uses a fresh engine so solution and user code don't share state.
 */

import { LuaFactory } from 'wasmoon';

let factory = null;

function getFactory() {
  if (!factory) {
    factory = new LuaFactory();
  }
  return factory;
}

/**
 * Run Lua code and capture print output.
 * @param {string} code - Lua source code
 * @returns {Promise<{ output: string[], error?: string }>}
 */
export async function runCode(code) {
  const output = [];
  const capturePrint = (...args) => {
    const line = args.map(arg => String(arg)).join('\t');
    output.push(line);
  };

  try {
    const luaFactory = getFactory();
    let engine;
    try {
      engine = await luaFactory.createEngine();
    } catch (err) {
      return { output: [], error: `Failed to init Lua: ${err?.message ?? String(err)}` };
    }

    try {
      engine.global.set('print', capturePrint);
      await engine.doString(code);
      return { output };
    } catch (err) {
      return { output, error: err?.message ?? String(err) };
    } finally {
      engine.global.close();
    }
  } catch (err) {
    return { output: [], error: err?.message ?? String(err) };
  }
}

/**
 * Normalize captured output for comparison: trim lines, join with newline.
 * @param {string[]} lines
 * @returns {string}
 */
export function normalizeOutput(lines) {
  return lines.map(line => line.trim()).join('\n').trim();
}
