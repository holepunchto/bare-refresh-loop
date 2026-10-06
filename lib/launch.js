const path = require('path')

const apps = {
  darwin: (out, name) => path.join(out, name + '.app'),
  ios: (out, name) => path.join(out, name + '.app'),
  android: (out, name) => path.join(out, name + '.apk'),
  linux: (out, name) => path.join(out, name + '.AppDir'),
  win32: (out, name) => path.join(out, name)
}

module.exports = async function launch(opts = {}) {
  const { device, out, name, port } = opts

  const app = apps[device.platform]

  if (app === undefined) return null

  // The app reaches the server on the same port on the device, so that
  // `127.0.0.1` is the right address on both ends.
  await device.reverse(port)

  await device.install(app(out, name))

  return device.launch(app(out, name), { activate: true })
}
