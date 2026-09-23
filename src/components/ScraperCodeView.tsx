import React, { useState } from 'react';
import { Code2, Package, Copy, Check, Terminal } from 'lucide-react';
import { PYTHON_SCRAPER_CODE, LIBRARIES_USED } from '../data/scraperCode';

export default function ScraperCodeView() {
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SCRAPER_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
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

        {/* Quick Install */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-semibold">Quick Install</span>
          </div>
          <code className="text-green-300 text-sm">
            pip install requests beautifulsoup4 selenium
          </code>
        </div>
      </div>

      {/* Code Structure Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-purple-600" />
          Code Structure
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "ShippingChecker", desc: "Checks if Zooplus ships to Greece by scanning the shipping page", type: "class" },
            { name: "CategoryCrawler", desc: "Crawls dry_food and treats category pages, collects product URLs", type: "class" },
            { name: "ProductExtractor", desc: "Extracts all data fields from individual product pages", type: "class" },
            { name: "CSVExporter", desc: "Maps ProductRow data to COLUMNS schema and writes CSV", type: "class" },
            { name: "ZooplusGRScraper", desc: "Main orchestrator — runs the full pipeline end-to-end", type: "class" },
            { name: "auto_tag_meat_category()", desc: "Regex-based auto-tagger for main meat category", type: "function" },
            { name: "ProductRow", desc: "Dataclass with all 47 columns as typed fields", type: "dataclass" },
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
            zooplus_gr_scraper.py
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

        {showFullCode ? (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
            <code>{PYTHON_SCRAPER_CODE}</code>
          </pre>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-gray-100 text-xs leading-relaxed max-h-64 overflow-hidden relative">
              <code>{PYTHON_SCRAPER_CODE.slice(0, 2000)}...</code>
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

      {/* Output Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📁 Output: zooplus_gr_dogfood.csv</h2>
        <p className="text-sm text-gray-600 mb-4">
          The scraper outputs a UTF-8 BOM CSV file ready for direct Google Sheets import.
          Each row = one product flavor. Empty cells for missing data.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          <table className="text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="px-2 py-1 text-left">Brand</th>
                <th className="px-2 py-1 text-left">Product Name</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Flavor</th>
                <th className="px-2 py-1 text-left">Price</th>
                <th className="px-2 py-1 text-left">€/kg</th>
                <th className="px-2 py-1 text-left">Ships GR</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-gray-200">
                <td className="px-2 py-1">Royal Canin</td>
                <td className="px-2 py-1">Maxi Adult</td>
                <td className="px-2 py-1">Dry Food</td>
                <td className="px-2 py-1">Chicken & Rice</td>
                <td className="px-2 py-1">69.99</td>
                <td className="px-2 py-1">4.67</td>
                <td className="px-2 py-1 text-green-600">true</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-2 py-1">Acana</td>
                <td className="px-2 py-1">Adult Light & Fit</td>
                <td className="px-2 py-1">Dry Food</td>
                <td className="px-2 py-1">Chicken & Turkey</td>
                <td className="px-2 py-1">72.49</td>
                <td className="px-2 py-1">6.36</td>
                <td className="px-2 py-1 text-green-600">true</td>
              </tr>
              <tr>
                <td className="px-2 py-1">Pedigree</td>
                <td className="px-2 py-1">Dentastix</td>
                <td className="px-2 py-1">Treat</td>
                <td className="px-2 py-1">Fresh</td>
                <td className="px-2 py-1">4.49</td>
                <td className="px-2 py-1 text-gray-400">—</td>
                <td className="px-2 py-1 text-green-600">true</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
