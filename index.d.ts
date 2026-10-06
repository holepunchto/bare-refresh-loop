import Console from 'bare-console'
import { DeviceProcess } from 'bare-device'
import RefreshServer from 'bare-refresh/server'
import { Watcher } from 'bare-refresh-watch'
import { LaunchOptions } from './lib/launch'

/** A transport such as `bare-refresh-transport-tcp`. */
interface Transport {
  /** The specifier of the function the application connects with. */
  client: string
  /** Accept connections on `port` for `server`, returning something that can be closed. */
  listen(server: RefreshServer, opts: { port: number }): { close(): void }
}

interface LoopOptions {
  /** The path of the entry of the application. */
  entry: string
  /** The directory of the application. Defaults to the directory of `entry`. */
  base?: string
  /** The host to build for. Defaults to this machine. */
  host?: string
  /** The name of the device to run on. Defaults to a device of `host` that is already running. */
  device?: string | null
  /** The port the server listens on. Defaults to `9000`. */
  port?: number
  /** The address the application connects to. Defaults to `127.0.0.1`. */
  address?: string
  name: string
  identifier: string
  /** The runtime to build the app with. */
  runtime: string
  /** Defaults to `<base>/.refresh`. */
  staging?: string
  /** The output directory. Defaults to `<base>/out-dev/<host>`. */
  out?: string
  transport: Transport
  /** Modules to leave out of the bundle, as the host provides them. */
  builtins?: string[]
  /** Called before every pack, such as to run a compiler. */
  prepare?: (() => unknown) | null
  /** How to launch the app. Defaults to `bare-refresh-loop/launch`. */
  launch?: (opts: LaunchOptions) => Promise<DeviceProcess | null>
  /** More files to watch, such as the input of `prepare`, relative to `base`. */
  watching?: string[]
  /** How many milliseconds changes have to stop for before the application is updated. */
  delay?: number
  /**
   * Where to print progress, failures and what the application prints. Defaults to the global
   * console.
   */
  console?: Console
}

interface Loop {
  readonly server: RefreshServer
  readonly sockets: { close(): void }
  readonly watcher: Watcher

  /** Stop watching and serving, and close the application. */
  close(): Promise<void>
}

/**
 * Build the application, launch it, and update it whenever the files that went into it change.
 * What the application prints, and the failures it reports, are printed with paths on disk. Only
 * JavaScript is refreshed, so a rebuilt addon requires a restart.
 */
declare function loop(opts: LoopOptions): Promise<Loop>

declare namespace loop {
  export { type Loop, type LoopOptions, type Transport }
}

export = loop
