import { execSync } from "child_process";
import * as os from "os";
import { machineIdSync } from "node-machine-id";

function generateHardwareID(): string {
  const hardwareComponents: string[] = [
    getProcessorId(),
    getBaseboardId(),
    getDiskDriveId(),
    getSID(),
    getKeyboardDeviceId(),
    getMonitorId(),
    getBIOSId(),
    getMacAddresses(),
  ];

  const combinedId: string = hardwareComponents.join(",");
  const combinedBytes: Buffer = Buffer.from(combinedId, "utf8");
  return combinedBytes.toString("base64");
}

function getProcessorId(): string {
  try {
    if (os.platform() === "win32") {
      const output: string = execSync("wmic cpu get ProcessorId /format:list").toString();
      return output.split("=")[1].trim();
    } else if (os.platform() === "linux") {
      const output: string = execSync('cat /proc/cpuinfo | grep -m 1 "processor"').toString();
      return output.split(":")[1].trim();
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error getting Processor ID:", error);
    return "";
  }
}

function getBaseboardId(): string {
  try {
    if (os.platform() === "win32") {
      const output: string = execSync("wmic baseboard get SerialNumber /format:list").toString();
      return output.split("=")[1].trim();
    } else if (os.platform() === "linux") {
      const output: string = execSync("sudo dmidecode -s baseboard-serial-number").toString();
      return output.trim();
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error getting Baseboard ID:", error);
    return "";
  }
}

function getDiskDriveId(): string {
  try {
    if (os.platform() === "win32") {
      const output: string = execSync("wmic diskdrive get SerialNumber /format:list").toString();
      return output.split("=")[1].trim();
    } else if (os.platform() === "linux") {
      const output: string = execSync("lsblk -d -o name,serial").toString();
      const lines: string[] = output.trim().split("\n");
      return lines[1].split(" ")[1].trim();
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error getting Disk Drive ID:", error);
    return "";
  }
}

function getSID(): string {
  if (os.platform() === "win32") {
    return `${os.userInfo().username}@${os.hostname()}`;
  } else {
    return `${os.userInfo().username}@${os.hostname()}`;
  }
}

function getKeyboardDeviceId(): string {
  if (os.platform() === "win32") {
    return os.userInfo().username;
  } else {
    return os.userInfo().username;
  }
}

function getMonitorId(): string {
  return os.hostname();
}

function getBIOSId(): string {
  try {
    if (os.platform() === "win32") {
      const output: string = execSync("wmic bios get SerialNumber /format:list").toString();
      return output.split("=")[1].trim();
    } else if (os.platform() === "linux") {
      const output: string = execSync("sudo dmidecode -s bios-version").toString();
      return output.trim();
    } else {
      return "";
    }
  } catch (error) {
    console.error("Error getting BIOS ID:", error);
    return "";
  }
}

function getMacAddresses(): string {
  if (os.platform() === "win32") {
    const networkInterfaces = os.networkInterfaces();
    const macAddresses: string[] = [];

    for (const iface of Object.values(networkInterfaces)) {
      for (const { mac } of iface || []) {
        if (mac && mac !== "00:00:00:00:00:00") {
          macAddresses.push(mac);
        }
      }
    }

    return macAddresses.join(",");
  } else if (os.platform() === "linux") {
    try {
      const output: string = execSync('ip link | grep "link/ether"').toString();
      const lines: string[] = output.trim().split("\n");
      const macAddresses: string[] = lines.map((line) => line.split(" ")[1]);
      return macAddresses.join(",");
    } catch (error) {
      console.error("Error getting MAC Addresses:", error);
      return "";
    }
  } else {
    return "";
  }
}
console.log(await generateHardwareID());
