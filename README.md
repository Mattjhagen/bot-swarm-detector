# 🛡️ Bot Swarm Detector

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.10+-blue) ![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-green)

**An AI-powered browser extension that detects coordinated "Agentic Swarms" and bot activity on social media.**

> **Note:** This project is currently an MVP (Minimum Viable Product) targeting **Reddit** comments. It runs locally on your machine to ensure privacy and avoid API costs.

---

## 🧐 What is this?

Modern propaganda doesn't just use "dumb" bots; it uses **Agentic Swarms**—groups of LLM-powered accounts that coordinate to flood a comment section with a specific narrative.

**Bot Swarm Detector** goes beyond simple spam filters. It uses a local Python backend to analyze comments in real-time based on the **"Triangle of Suspicion"**:

1.  **Metadata Anomalies:** Detects suspicious account age-to-volume ratios.
2.  **Linguistic Fingerprinting:** Uses NLP to detect the "neutral hedging" style typical of AI models (GPT, Llama, etc.).
3.  **Swarm Coordination:** The "Killer Feature." It calculates vector similarity between different users to catch bots saying the same thing in slightly different words.

---

## 🚀 Features

* **Client-Side Privacy:** All analysis happens on your local machine (localhost). No data is sent to third-party clouds.
* **Real-Time Scoring:** Injects a "Risk Badge" (Green/Yellow/Red) directly next to usernames in the browser.
* **Vector Analysis:** Uses `sentence-transformers` and `ChromaDB` to detect semantic duplicates across a thread.
* **Transparent Metrics:** Hover over a badge to see *why* an account was flagged (e.g., "High Swarm Similarity: 85%").

---

## 🛠️ Tech Stack

* **Frontend:** Chrome Extension (Manifest V3), JavaScript (Vanilla).
* **Backend:** Python 3.10+, FastAPI.
* **AI/ML:** `sentence-transformers` (all-MiniLM-L6-v2), `scikit-learn`.
* **Database:** ChromaDB (Local ephemeral vector store).

---

## 📦 Installation Guide

### Prerequisites
* Python 3.10 or higher installed.
* Google Chrome (or Brave/Edge).

### Part 1: Setting up the Backend (The "Brain")

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/bot-swarm-detector.git](https://github.com/yourusername/bot-swarm-detector.git)
    cd bot-swarm-detector
    ```

2.  **Create and activate a Virtual Environment (Recommended):**
    * *macOS/Linux:*
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    * *Windows:*
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the Local API Server:**
    ```bash
    uvicorn backend.main:app --reload
    ```
    *You should see: `Uvicorn running on http://127.0.0.1:8000`*

### Part 2: Installing the Extension (The "Eyes")

1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Toggle **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `extension` folder inside this repository.
5.  Pin the shield icon 🛡️ to your browser toolbar!

---

## 🎮 How to Use

1.  Ensure your backend server is running (`uvicorn ...`).
2.  Go to any **Reddit** comment thread.
3.  Click the extension icon and hit **"Scan Thread"**.
4.  Wait a few seconds. You will see badges appear next to usernames:
    * 🟢 **Low Risk (0-30%):** Likely human.
    * 🟡 **Medium Risk (30-70%):** Suspicious language or metadata.
    * 🔴 **High Risk (70-100%):** Strong evidence of swarm coordination or AI generation.

---

## 🤝 Contributing

We welcome contributions! Specifically, we are looking for:
* **Support for YouTube/Twitter:** Adapting the DOM scrapers for other platforms.
* **Better Models:** Optimizing the NLP layer for speed.
* **UI Polish:** Making the badges look native to the platform.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## ⚠️ Disclaimer

This tool provides a **probabilistic score**, not a definitive judgment. A "High Risk" score means the activity matches patterns common to bots, but false positives are possible. This tool is for educational and research purposes to help users identify potential inauthentic behavior.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
