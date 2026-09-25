// Converts each packages/*/shaders/*.glsl file to a JavaScript module exporting its source, as
// CesiumJS does: the published packages are plain ES modules, without a bundler to load .glsl.
import {glob, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const SHADERS = 'packages/*/shaders/*.glsl';

/**
 * @param {string} glslFile
 */
export async function buildShader(glslFile) {
  const contents = (await readFile(glslFile, 'utf8')).replace(/\r\n/g, '\n');
  const jsFile = glslFile.replace(/\.glsl$/, '.js');
  await writeFile(jsFile, `// This file is automatically rebuilt from ${glslFile.split('/').pop()}.\nexport default ${JSON.stringify(contents)};\n`);
}

export async function buildShaders() {
  for await (const glslFile of glob(SHADERS)) {
    await buildShader(glslFile);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildShaders();
}
