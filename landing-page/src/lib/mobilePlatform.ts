export type MobilePlatform = "ios" | "android" | "other";

type DeviceNavigator = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

/**
 * Detect the mobile operating system used to open the download page.
 * The touch check covers modern iPads that identify themselves as Macs.
 */
export function detectMobilePlatform(device: DeviceNavigator): MobilePlatform {
  if (/android/i.test(device.userAgent)) {
    return "android";
  }

  if (
    /iPad|iPhone|iPod/i.test(device.userAgent) ||
    (device.platform === "MacIntel" && device.maxTouchPoints > 1)
  ) {
    return "ios";
  }

  return "other";
}
