import { test } from 'uvu'
import assert from 'uvu/assert'
import execa from 'execa'

test('register', async () => {
  const { stdout } = await execa('node', [
    '-r',
    `${process.cwd()}/register.js`,
    `${process.cwd()}/tests/fixture.ts`,
  ])
  assert.is(stdout, 'text')
})

test('register2', async ()=> {
  const { stdout } = await execa('node', [
    '-r',
    `${process.cwd()}/register.js`,
    `${process.cwd()}/tests/fixture.arrowFunction.ts`,
  ])
  assert.is(stdout, 'hello from ts')
})
 
test('import', async () => {
  const { stdout } = await execa('node', [
    '-r',
    `${process.cwd()}/register.js`,
    `${process.cwd()}/tests/import.ts`,
  ])
  assert.is(stdout, 'true')
})

test.run()
