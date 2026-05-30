import { Request, Response } from "express";
import { ChildProcess, execFile, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

type TestRunStatus = "queued" | "running" | "passed" | "failed" | "error" | "stopped";

type TestRun = {
  id: string;
  suite: string;
  label: string;
  command: string;
  args: string[];
  status: TestRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  exitCode?: number | null;
  logs: string[];
  reportDir: string;
  logPath: string;
  resultPath: string;
  summary?: TestRunSummary;
  requestedBy?: string;
  mongoTestUri?: string;
};

type TestRunSummary = {
  testFiles?: string;
  tests?: string;
  passed?: number;
  failed?: number;
  skipped?: number;
};

const SUITES: Record<string, { label: string; command: string; args: string[]; accent: string }> = {
  all: { label: "All Contest Tests", command: npmBin(), args: ["run", "test:contest"], accent: "slate" },
  admin: { label: "Admin Workflows", command: npmBin(), args: ["run", "test:contest:admin"], accent: "indigo" },
  user: { label: "User Workflows", command: npmBin(), args: ["run", "test:contest:user"], accent: "emerald" },
  scoring: { label: "Scoring Accuracy", command: npmBin(), args: ["run", "test:contest:scoring"], accent: "amber" },
  standings: { label: "Standings & Ranking", command: npmBin(), args: ["run", "test:contest:standings"], accent: "cyan" },
  security: { label: "Security", command: npmBin(), args: ["run", "test:contest:security"], accent: "rose" },
  performance: { label: "Performance", command: npmBin(), args: ["run", "test:contest:performance"], accent: "violet" },
  e2e: { label: "API E2E Flows", command: npmBin(), args: ["run", "test:contest:e2e"], accent: "blue" },
};

const runs = new Map<string, TestRun>();
const processes = new Map<string, ChildProcess>();
const stoppingRuns = new Set<string>();
const stopTimeouts = new Map<string, NodeJS.Timeout>();
const listeners = new Map<string, Set<Response>>();

function spawnSuiteProcess(suite: (typeof SUITES)[string], env: NodeJS.ProcessEnv) {
  const cwd = backendCwd();
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", suite.command, ...suite.args], {
      cwd,
      env,
      windowsHide: true,
    });
  }
  return spawn(suite.command, suite.args, { cwd, env });
}

function killTestProcess(child: ChildProcess, onDone?: () => void) {
  const finish = () => onDone?.();
  if (!child.pid) {
    try {
      child.kill();
    } catch {
      // Process may already be gone.
    }
    finish();
    return;
  }

  if (process.platform === "win32") {
    execFile(
      "taskkill",
      ["/PID", String(child.pid), "/T", "/F"],
      { windowsHide: true },
      () => {
        try {
          child.kill();
        } catch {
          // Ignore if the shell already exited.
        }
        finish();
      }
    );
    return;
  }

  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) {
      try {
        child.kill("SIGKILL");
      } catch {
        // Ignore if the process already exited.
      }
    }
    finish();
  }, 1000);
}

function clearStopTimeout(runId: string) {
  const timeout = stopTimeouts.get(runId);
  if (timeout) {
    clearTimeout(timeout);
    stopTimeouts.delete(runId);
  }
}

function scheduleForceStop(run: TestRun, runId: string, delayMs = 5000) {
  clearStopTimeout(runId);
  stopTimeouts.set(
    runId,
    setTimeout(() => {
      stopTimeouts.delete(runId);
      if (run.finishedAt) return;
      stoppingRuns.add(runId);
      processes.delete(runId);
      appendLog(run, "[contest-qa] Run force-stopped after kill timeout\n");
      finalizeRun(run, runId, null);
    }, delayMs)
  );
}

function finalizeRun(run: TestRun, runId: string, code: number | null) {
  if (run.finishedAt) return;
  clearStopTimeout(runId);
  processes.delete(runId);
  const stopped = stoppingRuns.has(runId);
  if (stopped) stoppingRuns.delete(runId);
  run.exitCode = code;
  run.status = stopped ? "stopped" : code === 0 ? "passed" : "failed";
  run.finishedAt = new Date();
  run.durationMs = run.finishedAt.getTime() - run.startedAt.getTime();
  if (stopped) appendLog(run, "[contest-qa] Run stopped by user\n");
  run.summary = summarizeLogs(run.logs);
  writeResult(run);
  broadcast(runId, "contest-test-finished", publicRun(run));
}

function npmBin() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function isSafeTestUri(uri: string) {
  return /test|contest-qa|localhost|127\.0\.0\.1/i.test(uri);
}

function backendCwd() {
  return path.resolve(process.cwd());
}

function repoRoot() {
  return path.resolve(process.cwd(), "..");
}

function reportsRoot() {
  return path.resolve(repoRoot(), "tests", "contest", "reports", "runs");
}

function runReportPaths(suite: string, id: string) {
  const reportDir = path.join(reportsRoot(), suite, id);
  return {
    reportDir,
    logPath: path.join(reportDir, "output.log"),
    resultPath: path.join(reportDir, "result.json"),
  };
}

function ensureRunFiles(run: TestRun) {
  fs.mkdirSync(run.reportDir, { recursive: true });
  if (!fs.existsSync(run.logPath)) fs.writeFileSync(run.logPath, "", "utf8");
  writeResult(run);
}

function stripAnsi(text: string) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function summarizeLogs(logs: string[]): TestRunSummary {
  const plain = stripAnsi(logs.join("\n"));
  const testFiles = plain.match(/Test Files\s+(.+)/)?.[1]?.trim();
  const tests = plain.match(/Tests\s+(.+)/)?.[1]?.trim();
  const failed = Number(plain.match(/(\d+)\s+failed/)?.[1] || 0);
  const passed = Number(plain.match(/(\d+)\s+passed/)?.[1] || 0);
  const skipped = Number(plain.match(/(\d+)\s+skipped/)?.[1] || 0);
  return { testFiles, tests, passed, failed, skipped };
}

function writeResult(run: TestRun) {
  const result = { ...publicRun(run), logs: undefined };
  fs.mkdirSync(run.reportDir, { recursive: true });
  fs.writeFileSync(run.resultPath, JSON.stringify(result, null, 2), "utf8");
}

function loadStoredRuns() {
  const root = reportsRoot();
  if (!fs.existsSync(root)) return;
  for (const suiteDir of fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    const suitePath = path.join(root, suiteDir.name);
    for (const runDir of fs.readdirSync(suitePath, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      const paths = runReportPaths(suiteDir.name, runDir.name);
      if (!fs.existsSync(paths.resultPath) || runs.has(runDir.name)) continue;
      try {
        const stored = JSON.parse(fs.readFileSync(paths.resultPath, "utf8"));
        const restoredStatus = stored.status || "error";
        const staleRunning = restoredStatus === "running" && !processes.has(runDir.name);
        const startedAt = new Date(stored.startedAt);
        const finishedAt = staleRunning
          ? new Date(stored.finishedAt || Date.now())
          : stored.finishedAt
            ? new Date(stored.finishedAt)
            : undefined;
        const runRecord: TestRun = {
          id: runDir.name,
          suite: stored.suite || suiteDir.name,
          label: stored.label || SUITES[suiteDir.name]?.label || suiteDir.name,
          command: stored.command || "",
          args: [],
          status: staleRunning ? "stopped" : restoredStatus,
          startedAt,
          finishedAt,
          durationMs: staleRunning
            ? finishedAt
              ? finishedAt.getTime() - startedAt.getTime()
              : stored.durationMs
            : stored.durationMs,
          exitCode: staleRunning ? stored.exitCode ?? null : stored.exitCode,
          logs: fs.existsSync(paths.logPath) ? fs.readFileSync(paths.logPath, "utf8").split(/\r?\n/).filter(Boolean) : [],
          summary: stored.summary,
          requestedBy: stored.requestedBy,
          ...paths,
        };
        if (staleRunning) {
          runRecord.logs.push("[contest-qa] Run recovered as stopped after server restart\n");
          fs.appendFileSync(paths.logPath, "[contest-qa] Run recovered as stopped after server restart\n", "utf8");
        }
        runs.set(runDir.name, runRecord);
        if (staleRunning) writeResult(runRecord);
      } catch {
        // A partially written report should not block access to healthy QA runs.
      }
    }
  }
}

function appendLog(run: TestRun, chunk: Buffer | string) {
  const text = String(chunk);
  const lines = text.split(/\r?\n/).filter(Boolean);
  run.logs.push(...lines);
  if (run.logs.length > 2000) run.logs.splice(0, run.logs.length - 2000);
  fs.appendFileSync(run.logPath, text, "utf8");
  broadcast(run.id, "contest-test-log", { lines });
}

function publicRun(run: TestRun) {
  return {
    id: run.id,
    suite: run.suite,
    label: run.label,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    exitCode: run.exitCode,
    command: `${run.command} ${run.args.join(" ")}`,
    requestedBy: run.requestedBy,
    reportDir: run.reportDir,
    logPath: run.logPath,
    resultPath: run.resultPath,
    summary: run.summary,
    logCount: run.logs.length,
  };
}

function broadcast(runId: string, event: string, data: unknown) {
  const targets = listeners.get(runId);
  if (!targets) return;
  for (const res of targets) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

export const getContestTestSuites = (_req: Request, res: Response): void => {
  res.json(
    Object.entries(SUITES).map(([id, suite]) => ({
      id,
      label: suite.label,
      command: `${suite.command} ${suite.args.join(" ")}`,
      accent: suite.accent,
    }))
  );
};

export const getContestTestRuns = (_req: Request, res: Response): void => {
  loadStoredRuns();
  res.json(Array.from(runs.values()).map(publicRun).sort((a, b) => +new Date(b.startedAt) - +new Date(a.startedAt)));
};

export const getContestTestRun = (req: Request, res: Response): void => {
  loadStoredRuns();
  const runId = String(req.params.id);
  const run = runs.get(runId);
  if (!run) {
    res.status(404).json({ message: "Test run not found" });
    return;
  }
  res.json({ ...publicRun(run), logs: run.logs });
};

export const startContestTestRun = (req: Request, res: Response): void => {
  const suiteId = String(req.body.suite || "all");
  const suite = SUITES[suiteId];
  if (!suite) {
    res.status(400).json({ message: "Invalid test suite" });
    return;
  }

  const mongoTestUri = String(req.body.mongoTestUri || process.env.MONGO_TEST_URI || "");
  if (!mongoTestUri) {
    res.status(400).json({ message: "MONGO_TEST_URI is required for contest tests" });
    return;
  }
  if (!isSafeTestUri(mongoTestUri)) {
    res.status(400).json({ message: "MONGO_TEST_URI must point to an isolated test database" });
    return;
  }

  const id = randomUUID();
  const paths = runReportPaths(suiteId, id);
  const run: TestRun = {
    id,
    suite: suiteId,
    label: suite.label,
    command: suite.command,
    args: suite.args,
    status: "running",
    startedAt: new Date(),
    ...paths,
    logs: [],
    requestedBy: req.currentUser?.email || req.currentUser?.fullName,
    mongoTestUri,
  };
  runs.set(id, run);
  ensureRunFiles(run);
  appendLog(run, `[contest-qa] Suite: ${suite.label}\n[contest-qa] Result: ${run.resultPath}\n[contest-qa] Log: ${run.logPath}\n`);

  const childEnv = {
    ...process.env,
    NODE_ENV: "test",
    JWT_SECRET: process.env.JWT_SECRET || "contest-test-secret",
    MONGO_TEST_URI: mongoTestUri,
    FORCE_COLOR: "0",
  };

  const child = spawnSuiteProcess(suite, childEnv);

  processes.set(id, child);

  child.stdout.on("data", (chunk) => appendLog(run, chunk));
  child.stderr.on("data", (chunk) => appendLog(run, chunk));
  child.on("error", (error) => {
    processes.delete(id);
    stoppingRuns.delete(id);
    if (run.finishedAt) return;
    run.status = "error";
    run.finishedAt = new Date();
    run.durationMs = run.finishedAt.getTime() - run.startedAt.getTime();
    appendLog(run, `[runner error] ${error.message}`);
    run.summary = summarizeLogs(run.logs);
    writeResult(run);
    broadcast(id, "contest-test-finished", publicRun(run));
  });
  child.on("close", (code) => finalizeRun(run, id, code));

  res.status(202).json(publicRun(run));
};

export const stopContestTestRun = (req: Request, res: Response): void => {
  const runId = String(req.params.id);
  loadStoredRuns();
  const run = runs.get(runId);
  if (!run) {
    res.status(404).json({ message: "Test run not found" });
    return;
  }
  if (run.status !== "running") {
    res.status(400).json({ message: "Test run is not running" });
    return;
  }

  stoppingRuns.add(runId);
  const child = processes.get(runId);

  if (!child) {
    appendLog(run, "[contest-qa] No active process found; marking run as stopped\n");
    finalizeRun(run, runId, null);
    res.json({ message: "Run stopped", run: publicRun(run) });
    return;
  }

  killTestProcess(child, () => scheduleForceStop(run, runId));
  res.status(202).json({ message: "Stop requested", run: publicRun(run) });
};

export const streamContestTestRun = (req: Request, res: Response): void => {
  const runId = String(req.params.id);
  const run = runs.get(runId);
  if (!run) {
    res.status(404).json({ message: "Test run not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const set = listeners.get(run.id) || new Set<Response>();
  set.add(res);
  listeners.set(run.id, set);

  res.write(`event: contest-test-snapshot\n`);
  res.write(`data: ${JSON.stringify({ run: publicRun(run), logs: run.logs })}\n\n`);

  req.on("close", () => {
    set.delete(res);
    if (set.size === 0) listeners.delete(run.id);
  });
};
