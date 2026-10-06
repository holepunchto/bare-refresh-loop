const test = require('brittle')
const launch = require('bare-refresh-loop/launch')

test('a device that cannot launch apps is left to the user', async (t) => {
  t.is(await launch({ device: { platform: 'freebsd' }, out: '/tmp/out', name: 'App' }), null)
})
