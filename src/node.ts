import { dirname, extname } from 'path'
import { RawSourceMap } from 'source-map'
import sourceMapSupport from 'source-map-support'
import { transformSync } from 'esbuild'
import { addHook } from 'pirates'
import { getOptions } from './options'

const map: { [file: string]: string | RawSourceMap } = {}

function installSourceMapSupport() {
  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    environment: 'node',
    retrieveSourceMap(file) {
      if (map[file]) {
        return {
          url: file,
          map: map[file],
        }
      }
      return null
    },
  })
}

type EXTENSIONS = '.js' | '.jsx' | '.ts' |'.tsx'|'.mjs'
type LOADERS = 'js' | 'jsx' | 'ts' |'tsx'
const FILE_LOADERS: Record<EXTENSIONS, LOADERS> = {
  '.js': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.mjs': 'js',
};

const DEFAULT_EXTENSIONS = Object.keys(FILE_LOADERS);

const isKnownExtension = (ext: string): ext is EXTENSIONS => FILE_LOADERS.hasOwnProperty(ext)

const getLoader = (ext: string): LOADERS => isKnownExtension(ext) ? FILE_LOADERS[ext] : "ts"

function compile(code: string, filename: string) {
  const options = getOptions(dirname(filename))
  const ext = extname(filename)
  const { js, warnings, jsSourceMap } = transformSync(code, {
    sourcefile: filename,
    sourcemap: true,
    loader: getLoader(ext),
    target: options.target,
    jsxFactory: options.jsxFactory,
    jsxFragment: options.jsxFragment,
  })
  map[filename] = jsSourceMap
  if (warnings && warnings.length > 0) {
    for (const warning of warnings) {
      console.log(warning.location)
      console.log(warning.text)
    }
  }
  return js
}

export function register() {
  installSourceMapSupport()
  addHook(compile, {
    exts: DEFAULT_EXTENSIONS,
  })
}
