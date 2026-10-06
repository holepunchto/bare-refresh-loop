# bare-refresh-loop

Build an application, launch it, and refresh it as its files change. The application is built with <https://github.com/holepunchto/bare-refresh-build>, launched on a device found with <https://github.com/holepunchto/bare-device>, and updated by a <https://github.com/holepunchto/bare-refresh> server whenever <https://github.com/holepunchto/bare-refresh-watch> reports a change. The loop yields what happens along the way, including what the application prints and the failures it reports.

```
npm i bare-refresh-loop
```

## Usage

```js
const loop = require('bare-refresh-loop')

for await (const event of loop({
  entry: require.resolve('./app.js'),
  name: 'Demo',
  identifier: 'to.holepunch.demo',
  runtime: 'bare-native/runtime',
  transport: require('bare-refresh-transport-tcp')
})) {
  switch (event.type) {
    case 'stdout':
      console.log(event.line)
      break
    case 'stderr':
      console.error(event.line)
      break
    case 'report':
      console.error(event.message)
      break
    case 'error':
      console.error(event.error.message)
      break
  }
}
```

## License

Apache-2.0
