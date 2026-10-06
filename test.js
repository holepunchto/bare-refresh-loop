const test = require('brittle')
const launch = require('bare-refresh-loop/launch')

test('a device that cannot launch apps is left to the user', async (t) => {
  const lines = []

  const console = {
    log: (...data) => lines.push(data.join(' '))
  }

  t.is(
    await launch({ device: { platform: 'freebsd' }, out: '/tmp/out', name: 'App', console }),
    null
  )

  t.alike(lines, ['built in /tmp/out - launch it yourself'])
})
