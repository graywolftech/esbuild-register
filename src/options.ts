import fs from 'fs'
import JoyCon from 'joycon'
import strip from 'strip-json-comments'

const joycon = new JoyCon()

joycon.addLoader({
  test: /\.json$/,
  loadSync: (file) => {
    const content = fs.readFileSync(file, 'utf8')
    return JSON.parse(strip(content))
  },
})

export const getOptions = (
  cwd: string,
): { path?: string; jsxFactory?: string; jsxFragment?: string; target?: string } => {
  const { data, path } = joycon.loadSync(['tsconfig.json'], cwd)
  if (path && data) {
    return {
      path,
      jsxFactory: data.compilerOptions?.jsxFactory,
      jsxFragment: data.compilerOptions?.jsxFragmentFactory,
      target: data.compilerOptions?.target,
    }
  }
  return {}
}
