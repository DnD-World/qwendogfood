import React, { useState } from 'react';
import { Code2, Package, Copy, Check, Terminal, AlertTriangle, CheckCircle2, Zap, Shield, RotateCcw } from 'lucide-react';
import { PYTHON_SCRAPER_CODE, LIBRARIES_USED } from '../data/scraperCode';

export default function ScraperCodeView() {
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SCRAPER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const issues = [
    {
      severity: "critical",
      title: "Selenium imported but never used",
      before: "from selenium import webdriver ... (unused)",
      after: "Removed entirely. BeautifulSoup + requests handles 95% of cases. Add Selenium only if Zooplus blocks headless requests.",
    },
    {
      severity: "critical",
      title: "No retry logic — single failure kills the run",
      before: "response = self.session.get(url, timeout=15)",
      after: "RobustSession with 3 retries, exponential backoff (5s → 15s → 30s), jitter, and 429/503 handling.",
    },
    {
      severity: "critical",
      title: "No checkpointing — crash at product 500 loses everything",
      before: "No persistence between runs",
      after: "CheckpointManager saves state every 25 products via pickle. Resume with --resume flag.",
    },
    {
      severity: "high",
      title: "Fixed delay is detectable as a bot",
      before: "time.sleep(2)  # constant",
      after: "random.uniform(2.0, 5.0) — jittered delays between requests.",
    },
    {
      severity: "high",
      title: "Fragile regex class selectors",
      before: "soup.find(class_=re.compile(r'brand|manufacturer', re.I))",
      after: "Priority extraction: JSON-LD → Meta tags → HTML fallback. Structured data is stable.",
    },
    {
      severity: "high",
      title: "No data validation before export",
      before: "All rows exported regardless of completeness",
      after: "ProductRow.is_valid() checks minimum fields. Invalid rows are logged and dropped.",
    },
    {
      severity: "medium",
      title: "Meat category false positives",
      before: "Simple keyword 'in' check — 'chicken' matches 'chicken-flavored toy'",
      after: "Word-boundary regex patterns (\\bchicken\\b) with priority ordering (specific before generic).",
    },
    {
      severity: "medium",
      title: "Deduplication key too narrow",
      before: "key = f\"{brand}|{flavor}|{type}\"",
      after: "key = f\"{brand}|{product_line}|{flavor}|{type}\" — includes product line to distinguish variants.",
    },
    {
      severity: "medium",
      title: "Greek price format not handled",
      before: "price_text.replace(',', '.')",
      after: "Handles '69,99 €', '69.99€', '69,99€', and strips non-breaking spaces.",
    },
    {
      severity: "low",
      title: "No CLI arguments",
      before: "Hardcoded output filename",
      after: "argparse with --no-resume and --output flags.",
    },
  ];

  const improvements = [
    { icon: <Shield className="w-5 h-5" />, title: "RobustSession", desc: "Automatic retries with backoff, 429/503 handling, jitter" },
    { icon: <RotateCcw className="w-5 h-5" />, title: "Checkpoint & Resume", desc: "Save state every 25 products. Resume after crash." },
    { icon: <Zap className="w-5 h-5" />, title: "3-Layer Extraction", desc: "JSON-LD → Meta tags → HTML scraping (priority order)" },
    { icon: <CheckCircle2 className="w-5 h-5" />, title: "Data Validation", desc: "is_valid() gate before export. Invalid rows logged." },
    { icon: <Package className="w-5 h-5" />, title: "Smart Dedup", desc: "Keeps the row with most data filled when duplicates found." },
  ];

  return (
    <div className="space-y-6">
      {/* Code Review — Issues Found */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Code Review: Issues Fixed in v2
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          The original v1 had 10 issues. Here's what was wrong and how it was fixed:
        </p>

        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                issue.severity === 'critical' ? 'border-red-500 bg-red-50' :
                issue.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  issue.severity === 'critical' ? 'bg-red-200 text-red-800' :
                  issue.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                  issue.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {issue.severity}
                </span>
                <h4 className="font-semibold text-gray-800 text-sm">{issue.title}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/60 p-2 rounded border border-red-200">
                  <span className="text-red-600 font-semibold">Before:</span>
                  <code className="block mt-1 text-gray-700">{issue.before}</code>
                </div>
                <div className="bg-white/60 p-2 rounded border border-green-200">
                  <span className="text-green-600 font-semibold">After:</span>
                  <code className="block mt-1 text-gray-700">{issue.after}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Improvements */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-600" />
          Key Improvements in v2
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {improvements.map((item, index) => (
            <div key={index} className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2 text-green-700">
                {item.icon}
                <h4 className="font-semibold text-sm">{item.title}</h4>
              </div>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Libraries Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Libraries & Dependencies
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LIBRARIES_USED.map((lib, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {lib.name}
                </code>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  lib.install === 'Built-in' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {lib.install === 'Built-in' ? 'stdlib' : 'pip'}
                </span>
              </div>
              <p className="text-xs text-gray-600">{lib.purpose}</p>
              {lib.install !== 'Built-in' && (
                <code className="text-xs text-gray-400 mt-2 block">{lib.install}</code>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-semibold">Quick Install (only 2 external deps!)</span>
          </div>
          <code className="text-green-300 text-sm">
            pip install requests beautifulsoup4
          </code>
        </div>
      </div>

      {/* Code Structure Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-purple-600" />
          Code Structure (v2 — Simplified)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "RobustSession", desc: "HTTP session with retries, backoff, jitter, cookie handling", type: "class" },
            { name: "ShippingChecker", desc: "Checks if Zooplus ships to Greece. Cached result.", type: "class" },
            { name: "CategoryCrawler", desc: "Multi-strategy URL extraction (links, data-attrs, JSON-LD)", type: "class" },
            { name: "ProductExtractor", desc: "3-layer extraction: JSON-LD → Meta → HTML → Details", type: "class" },
            { name: "CheckpointManager", desc: "Pickle-based state save/restore for crash recovery", type: "class" },
            { name: "CSVExporter", desc: "UTF-8 BOM CSV output matching COLUMNS schema exactly", type: "class" },
            { name: "ZooplusGRScraper", desc: "Orchestrator with resume, checkpointing, validation", type: "class" },
            { name: "auto_tag_meat_category()", desc: "Word-boundary regex, priority-ordered patterns", type: "function" },
            { name: "detect_grains()", desc: "Returns (contains_grains, grain_free) tuple", type: "function" },
            { name: "ProductRow", desc: "Dataclass with 47 fields, dedup_key(), is_valid()", type: "dataclass" },
          ].map((item, index) => (
            <div key={index} className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-bold text-purple-700">{item.name}</code>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  item.type === 'class' ? 'bg-blue-100 text-blue-700' :
                  item.type === 'function' ? 'bg-green-100 text-green-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.type}
                </span>
              </div>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Python Code */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-green-600" />
            zooplus_gr_scraper.py <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">v2</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showFullCode ? 'Collapse' : 'Show Full Code'}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Usage instructions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Usage:</p>
          <div className="space-y-1 font-mono text-xs text-gray-600">
            <p>$ pip install requests beautifulsoup4</p>
            <p>$ python zooplus_gr_scraper.py              <span className="text-gray-400"># normal run (resumes if checkpoint exists)</span></p>
            <p>$ python zooplus_gr_scraper.py --no-resume   <span className="text-gray-400"># fresh start</span></p>
            <p>$ python zooplus_gr_scraper.py --output custom.csv  <span className="text-gray-400"># custom filename</span></p>
          </div>
        </div>

        {showFullCode ? (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
            <code>{PYTHON_SCRAPER_CODE}</code>
          </pre>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-gray-100 text-xs leading-relaxed max-h-64 overflow-hidden relative">
              <code>{PYTHON_SCRAPER_CODE.slice(0, 2500)}...</code>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent" />
            </pre>
            <button
              onClick={() => setShowFullCode(true)}
              className="mt-4 w-full py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
            >
              Click to expand full code ({PYTHON_SCRAPER_CODE.length.toLocaleString()} chars)
            </button>
          </div>
        )}
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 What's Next (Not in this scraper)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Proxy rotation", desc: "Add rotating proxy support for high-volume scraping. Use residential proxies to avoid blocks." },
            { title: "Selenium fallback", desc: "If Zooplus starts blocking requests, add headless Chrome as a fallback for JS-rendered pages." },
            { title: "Brand site scraper", desc: "Separate script to visit official brand sites for ingredients/nutritional data not on retailer pages." },
            { title: "Merger pipeline", desc: "Script to merge retailer data + brand data using the composite key (brand + line + flavor + type)." },
          ].map((item, index) => (
            <div key={index} className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <h4 className="font-semibold text-gray-700 text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
