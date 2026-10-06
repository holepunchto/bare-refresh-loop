import { DeviceProcess } from 'bare-device'
import { Report } from 'bare-refresh'
import RefreshServer from 'bare-refresh/server'
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
}

type LoopEvent =
  /** The application is about to be packed for `host`. */
  | { type: 'pack'; host: string }
  /** The application is about to be built into `out`. */
  | { type: 'build'; out: string }
  /** The server is listening on `port`. */
  | { type: 'listen'; port: number }
  /** The application was launched, or, if `app` is `null`, is left in `out` to launch by hand. */
  | { type: 'launch'; app: DeviceProcess | null; out: string }
  /** The files that are watched for changes. */
  | { type: 'watch'; files: string[] }
  /** The application connected, running the bundle `id` if it has one. */
  | { type: 'connection'; id: string | null }
  /** The application was sent the bundle `id`. */
  | { type: 'update'; id: string | null }
  /** Packing or serving the application failed. */
  | { type: 'error'; error: Error }
  /** The application reported a failure, which `message` describes with paths on disk. */
  | { type: 'report'; report: Report; message: string }
  /** The application printed `line` to its standard output. */
  | { type: 'stdout'; line: string }
  /** The application printed `line` to its standard error. */
  | { type: 'stderr'; line: string }

/**
 * Build the application, launch it, and update it whenever the files that went into it change,
 * yielding what happens along the way. Returning from the loop, such as by breaking out of a
 * `for await` loop, stops watching and serving, and closes the application. Only JavaScript is
 * refreshed, so a rebuilt addon requires a restart.
 */
declare function loop(opts: LoopOptions): AsyncGenerator<LoopEvent, void, undefined>

declare namespace loop {
  export { type LoopEvent, type LoopOptions, type Transport }
}

export = loop
