import { cpus, totalmem, freemem } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface SystemStats {
  cpuPercent: number | null;
  gpuPercent: number | null;
  ramUsedGB: number | null;
  ramTotalGB: number | null;
  vramUsedGB: number | null;
  vramTotalGB: number | null;
}

type CpuTimes = { idle: number; total: number };

let previousCpu: CpuTimes | null = null;

function cpuSnapshot(): CpuTimes {
  let idle = 0;
  let total = 0;

  for (const cpu of cpus()) {
    idle += cpu.times.idle;
    total += Object.values(cpu.times).reduce((a, b) => a + b, 0);
  }

  return { idle, total };
}

function cpuUsage(): number | null {
  const current = cpuSnapshot();
  const previous = previousCpu;
  previousCpu = current;

  if (!previous) return null;

  const totalDelta = current.total - previous.total;
  const idleDelta = current.idle - previous.idle;

  if (totalDelta <= 0) return null;

  return Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
}

async function gpuStats(): Promise<{
  gpuPercent: number | null;
  vramUsedGB: number | null;
  vramTotalGB: number | null;
}> {
  try {
    const { stdout } = await execFileAsync(
      "nvidia-smi",
      [
        "--query-gpu=utilization.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits",
      ],
      { timeout: 1500, windowsHide: true },
    );

    const line = stdout.trim().split(/\r?\n/)[0];
    if (!line) throw new Error("No GPU data");

    const values = line.split(",").map((v) => Number(v.trim()));

    const valid = (n: number) => Number.isFinite(n) && n >= 0 ? n : null;

    return {
      gpuPercent: valid(values[0]),
      vramUsedGB: valid(values[1]) === null ? null : values[1] / 1024,
      vramTotalGB: valid(values[2]) === null ? null : values[2] / 1024,
    };
  } catch {
    return {
      gpuPercent: null,
      vramUsedGB: null,
      vramTotalGB: null,
    };
  }
}

export async function readSystemStats(): Promise<SystemStats> {
  const total = totalmem();
  const free = freemem();
  const gpu = await gpuStats();

  return {
    cpuPercent: cpuUsage(),
    gpuPercent: gpu.gpuPercent,
    ramUsedGB: (total - free) / 1024 ** 3,
    ramTotalGB: total / 1024 ** 3,
    vramUsedGB: gpu.vramUsedGB,
    vramTotalGB: gpu.vramTotalGB,
  };
}
