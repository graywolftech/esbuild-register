import { dirname, extname } from 'path'
import { RawSourceMap } from 'source-map'
import sourceMapSupport from 'source-map-support'
import { buildSync } from 'esbuild'
import { addHook } from 'pirates'
import atob from 'atob'
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

function getSourceMap(js: string): string {
  const matched = js.match(
    /\/\/# sourceMappingURL=data:application\/json;base64,.*\n?/,
  )
  const result = ((matched && matched[0]) || '')
    .trim()
    .replace(/\/\/# sourceMappingURL=data:application\/json;base64,/, '')
  return atob(result)
}

function compile(code: string, filename: string) {
  const options = getOptions(dirname(filename))
  const { warnings, outputFiles } = buildSync({
    // tsconfig options
    tsconfig: options.path,
    // TODO: target should respect tsconfig
    // target: options.path ? undefined : options.target,
    target: options.target?.toLocaleLowerCase(),
    jsxFactory: options.jsxFactory,
    jsxFragment: options.jsxFragment,
    // TODO: support process.argv options, sourcemap, format, logLevel, stdin.loader
    sourcemap: true,
    format: 'cjs',
    write: false,
    stdin: {
      loader: getLoader(extname(filename)),
      sourcefile: filename,
      contents: code,
    },
    logLevel: "error",
  })

  const js = new TextDecoder('utf-8').decode(
    outputFiles?.find((_) => _)?.contents,
  )
  const jsSourceMap = getSourceMap(js)

  map[filename] = jsSourceMap
  for (const warning of warnings) {
    console.log(warning.location)
    console.log(warning.text)
  }

  return js
}

export function register() {
  installSourceMapSupport()
  addHook(compile, {
    exts: DEFAULT_EXTENSIONS,
  })
}
