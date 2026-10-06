const os = require('os')
const path = require('path')
const { fileURLToPath } = require('url')
const build = require('bare-refresh-build')
const watch = require('bare-refresh-watch')
const RefreshServer = require('bare-refresh/server')
const { find } = require('bare-device')
const defaultLaunch = require('./lib/launch')

module.exports = async function* loop(opts = {}) {
  const {
    entry,
    base = path.dirname(entry),
    host: requested = `${os.platform()}-${os.arch()}`,
    device: name = null,
    port = 9000,
    address = '127.0.0.1',
    staging = path.join(base, '.refresh'),
    transport,
    builtins = [],
    prepare = null,
    launch = defaultLaunch,
    watching = [],
    delay
  } = opts

  const device = await find({ platform: requested.split('-', 1)[0], name })

  // This machine can run more than its own host, such as `darwin-x64` under
  // Rosetta, so only another device decides what to build for.
  const host = device.kind === 'local' ? requested : device.host

  const out = opts.out || path.join(base, 'out-dev', host)

  const inputs = watching.map((file) => path.resolve(base, file))

  const queued = []

  let waiting = null
  let watcher = null
  let sockets = null
  let app = null
  let sources = new Set()
  let root = null

  function emit(event) {
    if (waiting === null) {
      queued.push(event)

      return
    }

    const resolve = waiting

    waiting = null

    resolve(event)
  }

  function next() {
    if (queued.length > 0) return Promise.resolve(queued.shift())

    return new Promise((resolve) => {
      waiting = resolve
    })
  }

  async function pack() {
    if (prepare !== null) await prepare()

    const packed = await build.pack({ entry, host, builtins })

    root = packed.root
    sources = new Set(packed.files)

    if (watcher !== null) watcher.update([...sources, ...inputs])

    return packed.bundle
  }

  try {
    yield { type: 'pack', host }

    const bundle = await pack()

    yield { type: 'build', out }

    await build(bundle, {
      base,
      staging,
      out,
      host,
      name: opts.name,
      identifier: opts.identifier,
      runtime: opts.runtime,
      client: transport.client,
      options: { port, host: address }
    })

    const server = new RefreshServer(pack)

    server
      .on('connection', (id) => emit({ type: 'connection', id }))
      .on('update', (id) => emit({ type: 'update', id }))
      .on('error', (error) => emit({ type: 'error', error }))
      .on('report', (report) => emit({ type: 'report', report, message: format(report) }))

    sockets = transport.listen(server, { port })

    yield { type: 'listen', port }

    app = await launch({
      device,
      host,
      out,
      name: opts.name,
      identifier: opts.identifier,
      port
    })

    if (app !== null) {
      if (app.stdout) lines(app.stdout, (line) => emit({ type: 'stdout', line }))
      if (app.stderr) lines(app.stderr, (line) => emit({ type: 'stderr', line }))
    }

    while (queued.length > 0) yield queued.shift()

    yield { type: 'launch', app, out }

    watcher = watch([...sources, ...inputs], { delay }, () =>
      server.update().catch((error) => emit({ type: 'error', error }))
    )

    yield { type: 'watch', files: watcher.files }

    while (true) yield await next()
  } finally {
    if (watcher !== null) watcher.close()
    if (sockets !== null) sockets.close()
    if (app !== null) await app.close()
  }

  function locate(key) {
    if (root === null) return null

    const file = fileURLToPath(new URL('.' + key, root))

    return sources.has(file) ? file : null
  }

  // The frames of the application with their paths on disk, leaving out the
  // frames of the module system and, when the application has frames of its
  // own, those of its dependencies.
  function frames(stack) {
    const kept = []

    let found = false
    let own = false

    for (const line of stack.split('\n')) {
      if (!/^\s*at /.test(line)) {
        kept.push([line, false])

        continue
      }

      const located = line.replace(/(^|[\s(])(\/[^\s():]+)/g, (match, before, key) => {
        const file = locate(key)

        if (file === null) return match

        found = true

        return before + file
      })

      if (located === line) continue

      const installed = /[/\\]node_modules[/\\]/.test(located)

      own = own || !installed

      kept.push([located, installed])
    }

    if (!found) return null

    return kept
      .filter(([, installed]) => !installed || !own)
      .map(([line]) => line)
      .join('\n')
  }

  function format(report) {
    const where = report.href === null ? '' : ' ' + (locate(report.href) || report.href)
    const stack = report.stack === null ? null : frames(report.stack)
    const body = stack || `${report.name}: ${report.message}`
    const after = report.intact ? '' : '\nthe graph was taken apart; the next edit builds it again'

    return `[${report.phase}]${where}\n${body}${after}`
  }
}

function lines(stream, online) {
  let buffered = ''

  stream
    .on('data', (data) => {
      const parts = (buffered + data.toString()).split(/\r?\n/)

      buffered = parts.pop()

      for (const line of parts) online(line)
    })
    .on('end', () => {
      if (buffered !== '') online(buffered)
    })
}
