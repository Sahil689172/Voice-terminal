// --- Imports (ESM-compatible) ---
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from "child_process";
import shellEscape from "shell-escape";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// --- __dirname shim for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Express app setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Whitelisted safe commands
const ALLOWED_COMMANDS = [
  "ls", "pwd", "whoami", "date", "df", "free", "ps", "cat", "mkdir",
  "rmdir", "rm", "mv", "cp", "echo", "find", "head", "pip", "cd",
  "top", "netstat", "touch"
];

// 🧭 Track persistent current directory
let currentDir = process.cwd();

// ✅ Safe execution wrapper
function safeExec(command, res) {
  const cmd = command.split(" ")[0];
  if (!ALLOWED_COMMANDS.some(c => cmd.startsWith(c))) {
    return res.json({ output: `❌ Unsafe or unknown command blocked: ${cmd}` });
  }

  exec(
    command,
    { shell: process.env.SHELL || "/bin/bash", cwd: currentDir },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        return res.json({ output: error.message });
      }
      if (stderr) return res.json({ output: stderr });
      console.log(`✅ Output:\n${stdout}`);
      res.json({ output: stdout || "✅ Command executed successfully" });
    }
  );
}

// 🎤 Main endpoint for text/voice commands
app.post("/execute", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "No command provided" });

  console.log(`🎤 Voice Command: ${command}`);
  const lower = command.toLowerCase();
  let terminalCommand = "";

  // --- Directory Navigation ---
  if (/^cd /.test(lower)) {
    const targetDir = command.slice(3).trim(); // keep spacing
    const newDir = path.resolve(currentDir, targetDir);
    if (fs.existsSync(newDir) && fs.lstatSync(newDir).isDirectory()) {
      currentDir = newDir;
      return res.json({ output: `📁 Moved to ${currentDir}` });
    } else {
      return res.json({ output: `❌ Directory not found: ${targetDir}` });
    }
  }

  if (/(move back|go back|previous directory|back one folder)/.test(lower)) {
    const newDir = path.resolve(currentDir, "..");
    if (fs.existsSync(newDir)) {
      currentDir = newDir;
      return res.json({ output: `📁 Moved back to ${currentDir}` });
    } else {
      return res.json({ output: `❌ Cannot move back from ${currentDir}` });
    }
  }

  // 🧭 Command Mapping
  switch (true) {
    case /(list|show|display).*files/.test(lower):
      terminalCommand = "ls";
      break;

    case /(create|make|new|generate).*file/.test(lower): {
      const name = lower.split("file")[1]?.trim() || "newfile.txt";
      terminalCommand = `touch ${shellEscape([name])}`;
      break;
    }

    case /(cat|open|show contents of|display).*/.test(lower): {
      const file = lower.split(" ").pop();
      terminalCommand = `cat ${shellEscape([file])}`;
      break;
    }

    case /^(echo|say|print)\s+/.test(lower):
      terminalCommand = `echo ${command.replace(/^(echo|say|print)\s+/i, "")}`;
      break;

    case /(show current directory|where am i|current folder|present working directory|current path)/.test(lower):
      terminalCommand = "pwd";
      break;

    case /(create|make|new).* (directory|folder)/.test(lower): {
      const dir = lower.split(/directory|folder/)[1]?.trim() || "newdir";
      terminalCommand = `mkdir ${shellEscape([dir])}`;
      break;
    }

    case /(delete|remove).* (directory|folder)/.test(lower): {
      const dir = lower.split(/directory|folder/)[1]?.trim() || "dir";
      terminalCommand = `rmdir ${shellEscape([dir])}`;
      break;
    }

    case /(delete|remove).*file/.test(lower): {
      const file = lower.split("file")[1]?.trim() || "file.txt";
      terminalCommand = `rm ${shellEscape([file])}`;
      break;
    }

    case /rename .* to .*/.test(lower): {
      const match = lower.match(/rename (.+) to (.+)/);
      terminalCommand = match
        ? `mv ${shellEscape([match[1], match[2]])}`
        : "echo 'Invalid rename syntax'";
      break;
    }

    case /copy .* to .*/.test(lower): {
      const match = lower.match(/copy (.+) to (.+)/);
      terminalCommand = match
        ? `cp ${shellEscape([match[1], match[2]])}`
        : "echo 'Invalid copy syntax'";
      break;
    }

    case /move .* to .*/.test(lower): {
      const match = lower.match(/move (.+) to (.+)/);
      terminalCommand = match
        ? `mv ${shellEscape([match[1], match[2]])}`
        : "echo 'Invalid move syntax'";
      break;
    }

    case /(who am i|what’s my username|display user)/.test(lower):
      terminalCommand = "whoami";
      break;

    case /(what.?s the date|show date|display date|current date|what.?s the time)/.test(lower):
      terminalCommand = "date";
      break;

    case /(disk usage|storage|check disk)/.test(lower):
      terminalCommand = "df -h";
      break;

    case /(running processes|list processes|display processes|show tasks)/.test(lower):
      terminalCommand = "ps aux";
      break;

    case /(top processes|cpu usage)/.test(lower):
      terminalCommand = "top -n 1";
      break;

    case /(memory usage|ram usage)/.test(lower):
      terminalCommand = "free -h";
      break;

    case /(network connections|network info|network status)/.test(lower):
      terminalCommand = "netstat -tulnp";
      break;

    case /find .*named/.test(lower): {
      const name = lower.split("named")[1]?.trim() || "*";
      terminalCommand = `find . -name ${shellEscape([name])}`;
      break;
    }

    case /(first 5 lines of)/.test(lower): {
      const file = lower.split("of")[1]?.trim();
      terminalCommand = `head -n 5 ${shellEscape([file])}`;
      break;
    }

    case /(pip install|install package|install )/.test(lower): {
      const pkg = lower.split("install")[1]?.trim();
      terminalCommand = `pip install ${shellEscape([pkg])}`;
      break;
    }

    case /(show help|list available commands|what can i say)/.test(lower):
      terminalCommand = "echo 'Refer to full command list in documentation'";
      break;

    default:
      terminalCommand = `echo 'Unknown command: ${command}'`;
  }

  // ✅ Execute safely in currentDir
  safeExec(terminalCommand, res);
});

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("✅ Voice Terminal Backend Connected Successfully!");
});

// --- Start Server ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Voice Terminal Server running on http://localhost:${PORT}`);
});

