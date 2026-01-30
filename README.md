# 🛡️ Bot Swarm Detector (BSD)

> **A Full-Stack AI System for detecting coordinated bot networks, LLM-generated content, and misinformation rhetoric on Social Media.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-teal.svg)

## 📖 Overview

The **Bot Swarm Detector** is a privacy-first, local-first tool designed to analyze comment threads on Reddit, X (Twitter), and Facebook. Unlike simple keyword filters, BSD uses **Vector Embeddings** and **Semantic Similarity** to detect coordinated "swarms"—different accounts saying semantically identical things to manipulate public opinion.

### Core Architecture
1.  **Chrome Extension (Manifest V3):** Scrapes comments from the DOM in real-time and injects risk badges.
2.  **FastAPI Backend:** Processes text using `SentenceTransformers` (PyTorch).
3.  **ChromaDB (Vector Database):** Stores comment embeddings in memory to detect semantic duplicates (swarms).
4.  **React Dashboard:** A simulation environment to test bot narratives against the detection logic.

---

## 🧠 Detection Logic (The 4 Layers)

The system assigns a **Risk Score (0-100)** based on four analysis layers:

| Layer | Name | Description |
| :--- | :--- | :--- |
| **1** | **Metadata Analysis** | Checks for "Burner Account" behavior (e.g., Account Age < 90 days + Post Volume > 1000). |
| **2** | **Linguistic Forensics** | Detects LLM/AI fingerprints (e.g., "It is important to note", "Complex tapestry") and unnaturally formal grammar. |
| **3** | **Swarm Detection** | **The Core Feature.** Uses **Vector Embeddings** (`all-MiniLM-L6-v2`) to calculate Cosine Similarity between comments. Flags distinct users pushing identical narratives. |
| **4** | **Rhetoric Matching** | Scans for known misinformation triggers and emotionally manipulative language (e.g., "Wake up," "The agenda," "Do your own research"). |

---

## 🚀 Installation & Setup

### Prerequisites
*   Python 3.10+
*   Node.js & npm
*   Google Chrome

### 1. Backend Setup (Python/FastAPI)

The backend handles the ML inference and Vector DB operations.

```bash
# Clone repository
git clone https://github.com/yourusername/bot-swarm-detector.git
cd bot-swarm-detector

# Install dependencies (Torch CPU version recommended for local dev)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt

# Run the Server
python backend/main.py
```
*The server will start on `http://localhost:8000`*

### 2. Frontend Dashboard (React/Vite)

The dashboard allows you to simulate threads and test the algorithm manually.

```bash
# In the root directory
npm install
npm run dev
```
*Open `http://localhost:5173` to view the dashboard.*

### 3. Chrome Extension Setup

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle in top right).
3.  Click **Load unpacked**.
4.  Select the `extension/` folder from this project.
5.  Navigate to Reddit, Facebook, or X/Twitter to see it in action.

---

## 🛠️ Usage

### Using the Extension
1.  Navigate to a comment section (e.g., a Reddit thread).
2.  Wait 2-3 seconds for the "Scan" to trigger (or scroll to load more comments).
3.  **Badges** will appear next to usernames:
    *   ✅ **Green:** Human / Safe.
    *   ⚠️ **Yellow:** Suspicious rhetoric or metadata.
    *   🔴 **Red:** Confirmed Bot or Swarm member.
4.  **Hover** over a badge to see the "Analysis Report" tooltip, showing the breakdown of why the user was flagged.

### Using the Mac Autostart Script
If you want the detection backend to run silently in the background whenever you log in to your Mac:

```bash
python backend/setup_mac_autostart.py
```

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py                # FastAPI app & Detection Logic
│   ├── requirements.txt       # Python dependencies
│   └── setup_mac_autostart.py # Mac LaunchAgent script
├── extension/
│   ├── manifest.json          # Chrome Ext configuration
│   ├── content.js             # DOM manipulation & Scraper
│   └── background.js          # API Communication
├── src/                       # React Frontend source
├── index.html                 # Frontend Entry
└── README.md                  # Documentation
```

## 🛡️ Privacy Note

*   **Local Processing:** When running locally, comment data is processed on your machine and stored in a temporary, in-memory Vector Database.
*   **No Persistence:** The database resets every session. No user data is permanently stored or sold.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
