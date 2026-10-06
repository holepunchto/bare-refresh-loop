# bare-refresh-loop

Build an application, launch it, and refresh it as its files change. The application is built with <https://github.com/holepunchto/bare-refresh-build>, launched on a device found with <https://github.com/holepunchto/bare-device>, and updated by a <https://github.com/holepunchto/bare-refresh> server whenever <https://github.com/holepunchto/bare-refresh-watch> reports a change. What the application prints, and the failures it reports, are printed by the loop.

```
npm i bare-refresh-loop
```

## Usage

```js
const loop = require('bare-refresh-loop')

await loop({
  entry: require.resolve('./app.js'),
  name: 'Demo',
  identifier: 'to.holepunch.demo',
  runtime: 'bare-native/runtime',
  transport: require('bare-refresh-transport-tcp')
})
```

## License

Apache-2.0
