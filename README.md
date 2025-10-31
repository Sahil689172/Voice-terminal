# Voice-Controlled VM Terminal Web Page

A voice-controlled terminal interface that allows you to execute Linux commands by speaking them. The project leverages the Web Speech API for voice recognition and connects to a Node.js backend via Ngrok to execute commands on your VM.

---

## 🧠 Project Architecture

The project is divided into three main layers:

### 🌐 1. Frontend (in Cursor / Browser)

The frontend is built using HTML, CSS, and JavaScript inside Cursor.
It leverages the Web Speech API to capture voice input 🎙️ and convert it into text-based commands.

#### ✨ Key Features

- 🎤 Real-time voice recognition using the browser's microphone.
- 🧾 Displays both the recognized speech and the executed command result.
- 🔗 Sends the recognized text (as a command) to the backend using fetch() via a POST request.
- 💬 Dynamically displays command output or errors in the interface.

#### ⚙️ Frontend Flow

🎙️ User Speaks → 🗣️ Web Speech API → 🧩 Command Text → 🚀 Send to Backend → 🖥️ Execute → 📜 Display Result

---

### 💻 2. Backend (in Terminal — Node.js + Express)

The backend runs on Node.js + Express, listening for commands sent from the frontend.
It receives a command via a POST request and executes it using child_process.exec().

#### 🧩 Code Summary (server.js)

```javascript
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from "child_process";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/execute", (req, res) => {
  const { command } = req.body;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: `Error: ${stderr || error.message}` });
    }
    res.json({ output: stdout });
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
```

#### 🧠 Responsibilities

- 📥 Receives spoken command from frontend (e.g., "ls", "pwd", "node -v").
- 🧰 Executes it securely in the backend environment.
- 📤 Returns the standard output or error to the frontend.
- 🌍 Uses CORS and body-parser for smooth JSON and cross-origin communication.

---

### ☁️ 3. Ngrok Integration

Since the backend runs locally, the frontend needs a public HTTPS URL to connect.
This is achieved via Ngrok 🧩.

#### 🪄 Steps

1. **▶️ Start backend:**
   ```bash
   node server.js
   ```

2. **🌐 Expose the backend using Ngrok:**
   ```bash
   ngrok http 5000
   ```

3. **📋 Copy the forwarding URL** (e.g., `https://abcd1234.ngrok-free.app`).

4. **🧭 Update frontend fetch URL:**
   ```javascript
   fetch("https://abcd1234.ngrok-free.app/execute", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ command }),
   });
   ```

✅ This allows your Cursor-based frontend to communicate with your local backend securely via Ngrok.

---

## 🗣️ Web Speech API (Voice Recognition)

The Web Speech API powers voice recognition and command interpretation.

### ⚙️ How It Works

- Uses built-in browser SpeechRecognition (supported in Chrome/Edge).
- Converts spoken audio to text.
- Sends recognized text to the backend automatically.

### 💻 Sample Code

```javascript
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";

recognition.onresult = (event) => {
  const command = event.results[0][0].transcript;
  console.log("Recognized:", command);
  sendCommand(command);
};

recognition.start();
```

🎯 Speak your command → it gets recognized → executed → and displayed live!

---

## 🎤 Supported Voice Commands

The following 15 voice commands are currently supported and working:

| # | Voice Command (Example) | Action / Description | Terminal Command Executed |
|---|-------------------------|---------------------|---------------------------|
| 1 | "Show files" | Lists files and directories in the current folder | `ls` |
| 2 | "Create a file" | Creates a new empty file (e.g., newfile.txt) | `touch newfile.txt` |
| 3 | "Display file" | Displays contents of a specified file | `cat <filename>` |
| 4 | "Delete file" | Removes a specified file | `rm <filename>` |
| 5 | "Echo hello world" | Prints text to the terminal | `echo hello world` |
| 6 | "Show current directory" / "Where am I" | Shows your current working directory | `pwd` |
| 7 | "Move back" / "Go back one folder" | Moves one directory up | `cd ..` |
| 8 | "Current date" / "Show date" | Displays system date and time | `date` |
| 9 | "Create directory test" | Creates a new directory | `mkdir test` |
| 10 | "Delete directory test" | Deletes an existing empty directory | `rmdir test` |
| 11 | "Disk usage" / "Check storage" | Displays disk space usage | `df -h` |
| 12 | "Who am I" / "Display user" | Shows current logged-in username | `whoami` |
| 13 | "List processes" / "Show tasks" | Lists all running processes | `ps aux` |
| 14 | "Memory usage" / "RAM usage" | Displays system memory usage | `free -h` |
| 15 | "List available commands" / "Show help" | Shows a summary of all commands | `echo 'Refer to full command list in documentation'` |

---

## 🚀 How to Run the Project

### 🧩 Clone the Project

```bash
git clone <repo-link>
cd voice-terminal
```

### 📦 Install Dependencies

```bash
npm install express body-parser cors
```

### 🖥️ Run the Backend

```bash
node server.js
```

### 🌍 Start Ngrok

```bash
ngrok http 5000
```

### 🔗 Copy the HTTPS Link

Replace the backend URL in your frontend fetch call with the Ngrok link.

### 💡 Run Frontend in Cursor

1. Open the HTML file inside Cursor.
2. Launch preview or open in the browser.
3. 🎤 Allow microphone access.
4. Speak your command and watch it execute live! ⚡

---

## 🧠 Example Voice Commands

| 🗣️ Spoken Command | 💻 Executed Shell Command | 📜 Output Example |
|-------------------|---------------------------|-------------------|
| "List files" | `ls` | Shows directory contents |
| "Show Node version" | `node -v` | v20.11.0 |
| "Print working directory" | `pwd` | /home/sahil/Desktop/project |
| "Run server" | `npm start` | Starts Node server |

---

## ⚙️ Security Note

⚠️ This prototype executes real system commands — for local use only.

Before public deployment, ensure:
- 🔒 Command whitelisting
- 👤 User authentication
- 🧹 Input sanitization
- 🚦 Rate limiting

---

## 🔮 Future Enhancements

### 🧩 1. Integrate LLMs / Ollama

Use Ollama, GPT, or Gemini API for natural language understanding —
e.g., "Start my backend server" → maps automatically to `node server.js`.

### 🗣️ 2. Improved Speech Recognition

Switch from Web Speech API to Whisper (OpenAI) or Mozilla DeepSpeech for higher accuracy & multilingual support.

### ⚡ 3. Interactive Web Dashboard

Build a terminal-style web UI with live logs, command history, dark mode, and keyboard shortcuts.

### 🧠 4. Context-Aware Commands

Maintain session context — enable "repeat last command", "clear screen", or "undo last action".

### ☁️ 5. Full Deployment

Host backend on Render / Railway / Vercel, and use Cloudflare Tunnel or Ngrok reserved domain for permanent secure links.

---

## 🧑‍💻 Built With

- 🖥️ **Frontend:** HTML, CSS, JavaScript (Web Speech API)
- ⚙️ **Backend:** Node.js, Express.js
- 🌐 **Tunneling:** Ngrok
- 💡 **IDE:** Cursor
- 🎙️ **API Used:** Web Speech API

---

## 📝 Notes

- Ensure microphone permissions are granted in your browser.
- The Web Speech API currently works best in Chrome and Edge.
- For safety, make sure the backend has command whitelisting to prevent destructive commands.
