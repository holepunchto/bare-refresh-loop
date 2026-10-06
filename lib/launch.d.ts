import { AppDevice, DeviceProcess } from 'bare-device'

interface LaunchOptions {
  device: AppDevice
  host: string
  /** The output directory of the build. */
  out: string
  name: string
  identifier: string
  /** The port the server listens on. */
  port: number
}

/**
 * Install and launch the app in `out` on `device`, after making `port` on this machine reachable
 * from the device. Resolves with `null` if the platform of `device` has no app to launch.
 */
declare function launch(opts: LaunchOptions): Promise<DeviceProcess | null>

declare namespace launch {
  export { type LaunchOptions }
}

export = launch
