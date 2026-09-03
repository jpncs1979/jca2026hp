/**
 * dev 起動前: ポート 3000 を他プロジェクト（例: ランスロ）が掴んでいれば終了する。
 * Windows 向け（netstat -ano）。
 */
const { execSync } = require("child_process");
const path = require("path");

const PORT = 3000;
const projectRoot = path.resolve(__dirname, "..").replace(/\//g, "\\").toLowerCase();

function getListeningPids(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (Number.isFinite(pid)) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function getProcessCommandLine(pid) {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );
    return (out || "").trim();
  } catch {
    return "";
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const pids = getListeningPids(PORT);
if (pids.length === 0) {
  process.exit(0);
}

let killed = 0;
for (const pid of pids) {
  const cmd = getProcessCommandLine(pid);
  const cmdLower = cmd.toLowerCase();
  const isThisProject = cmdLower.includes(projectRoot);
  const isNode = cmdLower.includes("node.exe") || cmdLower.includes("next");

  if (isThisProject || !isNode) continue;

  console.warn(
    `[ensure-dev-port] ポート ${PORT} を他プロジェクトが使用中のため終了します (PID ${pid})`
  );
  if (cmd) console.warn(`  ${cmd.slice(0, 160)}${cmd.length > 160 ? "…" : ""}`);
  if (killPid(pid)) killed++;
}

if (killed > 0) {
  console.warn(`[ensure-dev-port] ${killed} 件のプロセスを終了しました。`);
}
