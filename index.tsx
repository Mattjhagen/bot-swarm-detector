import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Loader2, ShieldAlert, Trash2, Plus, Play } from "lucide-react";

// Types matching the Python Backend
type CommentInput = {
  id: string;
  author: string;
  text: string;
  account_age_days: number;
  post_volume: number;
};

type ScoreResult = {
  comment_id: string;
  bot_score: number;
  breakdown: {
    metadata_risk: number;
    linguistic_risk: number;
    swarm_risk: number;
  };
  risk_level: "LOW" | "MEDIUM" | "HIGH";
};

const App = () => {
  const [comments, setComments] = useState<CommentInput[]>([]);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleAddComment = () => {
    if (!text) return;

    const newComment: CommentInput = {
      id: generateUUID(),
      author: author || `user_${Math.floor(Math.random() * 1000)}`,
      text: text,
      // Randomize metadata to simulate different account types
      account_age_days: Math.floor(Math.random() * 365),
      post_volume: Math.floor(Math.random() * 5000)
    };

    setComments([...comments, newComment]);
    setText("");
    // Keep author for easier multi-comment entry
  };

  const handleClear = () => {
    setComments([]);
    setResults([]);
  };

  const handleAnalyze = async () => {
    if (comments.length === 0) return;
    setLoading(true);
    setResults([]);

    try {
      // FIX: Added /analyze to the endpoint
      const response = await fetch('https://bot-swarm-detector-extension.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comments: comments })
      });

      if (!response.ok) throw new Error("Failed to connect to backend");

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to server. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const getResultForComment = (id: string) => results.find(r => r.comment_id === id);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-700 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2">
              <ShieldAlert className="w-8 h-8" />
              Bot Swarm Detector
            </h1>
            <p className="text-slate-400 mt-2">
              Add comments to the staging area to analyze them for coordination and AI patterns.
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            API Status: <span className="text-green-400">Targeting Production (Render)</span>
          </div>
        </header>

        {/* Input Section */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">1. Staging Area</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Author (Optional)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white w-1/4 focus:border-blue-500 outline-none"
            />
            <textarea
              placeholder="Paste comment text here..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white flex-1 focus:border-blue-500 outline-none min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2">
             <button 
              onClick={() => {
                setText("It is important to note that the complex tapestry of this situation requires a nuanced approach.");
              }}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm"
            >
              Insert Bot Text
            </button>
            <button 
              onClick={handleAddComment}
              disabled={!text}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add to Batch
            </button>
          </div>
        </div>

        {/* List Section */}
        {comments.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">2. Thread Simulation ({comments.length} comments)</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleClear}
                  className="px-4 py-2 text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded flex items-center gap-2 font-medium disabled:opacity-50 shadow-lg shadow-green-900/50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Scan Thread
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {comments.map((comment) => {
                const result = getResultForComment(comment.id);
                let borderClass = "border-slate-700";
                let statusBadge = null;

                if (result) {
                  if (result.risk_level === "HIGH") {
                    borderClass = "border-red-500 bg-red-950/20";
                    statusBadge = <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">BOT: {result.bot_score}%</span>;
                  } else if (result.risk_level === "MEDIUM") {
                    borderClass = "border-yellow-500 bg-yellow-950/20";
                    statusBadge = <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">RISK: {result.bot_score}%</span>;
                  } else {
                    borderClass = "border-green-500 bg-green-950/20";
                    statusBadge = <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">SAFE: {result.bot_score}%</span>;
                  }
                }

                return (
                  <div key={comment.id} className={`bg-slate-800 p-4 rounded-lg border-l-4 ${borderClass} transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{comment.author}</span>
                        {statusBadge}
                        <span className="text-xs text-slate-500">
                          Account: {comment.account_age_days}d | Karma: {comment.post_volume}
                        </span>
                      </div>
                      {result && (
                        <div className="flex gap-2 text-xs font-mono">
                           <div title="New Account + High Volume" className={`px-2 py-1 rounded ${result.breakdown.metadata_risk > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-400'}`}>
                              Meta: {result.breakdown.metadata_risk}
                           </div>
                           <div title="AI Patterns / Hedging" className={`px-2 py-1 rounded ${result.breakdown.linguistic_risk > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-400'}`}>
                              Ling: {result.breakdown.linguistic_risk}
                           </div>
                           <div title="Swarm Coordination" className={`px-2 py-1 rounded ${result.breakdown.swarm_risk > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-400'}`}>
                              Swarm: {result.breakdown.swarm_risk}
                           </div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}