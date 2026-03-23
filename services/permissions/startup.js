import { spawn } from "child_process";

const runChild = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });

async function start() {
  try {
    console.log("Running admin permissions seed...");
    // Run as a separate process so process.exit() in the script doesn't kill this parent.
    await runChild("node", ["scripts/seed-admin-permissions.js"]);
    console.log("Seed completed ✅");
  } catch (err) {
    console.log("Seed skipped or failed:", err?.message || err);
  }

  try {
    console.log("Running auth permissions seed...");
    await runChild("node", ["scripts/seed-auth-permissions.js"]);
    console.log("Auth seed completed ✅");
  } catch (err) {
    console.log("Auth seed skipped or failed:", err?.message || err);
  }

  console.log("Starting dev server...");
  // Keep the container alive on the dev server
  const child = spawn("npm", ["run", "dev"], { stdio: "inherit" });
  child.on("close", (code) => process.exit(code ?? 1));
}

start();
