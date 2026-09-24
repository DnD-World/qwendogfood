import React from 'react';
import { Database, Globe, GitMerge, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ArchitectureView() {
  const pipelineSteps = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Retailer Scraper",
      description: "Crawls Zooplus.gr, Petshop.gr, Zoo.gr, Amazon.de/es, BestPrice, Skroutz",
      outputs: ["Price", "Front Image", "Product URL", "ships_to_greece flag"],
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Brand Scraper",
      description: "Visits official brand websites for detailed nutritional data",
      outputs: ["Ingredients", "Nutritional Values", "Back Label Image"],
      color: "from-purple-500 to-purple-700",
    },
    {
      icon: <GitMerge className="w-8 h-8" />,
      title: "Merger",
      description: "Matches datasets using Brand + Flavor + Product Type as composite key",
      outputs: ["Complete product rows", "Deduplicated by flavor"],
      color: "from-amber-500 to-amber-700",
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: "Export",
      description: "Outputs CSV compatible with Google Sheets import",
      outputs: ["zooplus_gr_dogfood.csv", "Ready for Sheets upload"],
      color: "from-green-500 to-green-700",
    },
  ];

  const scrapingOrder = [
    { name: "Zooplus.gr / Zooplus.de", status: "Active", priority: 1 },
    { name: "Petshop.gr / Zoo.gr", status: "Queued", priority: 2 },
    { name: "Amazon.de / Amazon.es", status: "API Access Pending", priority: 3 },
    { name: "BestPrice / Skroutz", status: "Queued", priority: 4 },
    { name: "Official Brand Sites", status: "Queued", priority: 5 },
  ];

  return (
    <div className="space-y-8">
      {/* Pipeline Visualization */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Hybrid Scraping Pipeline
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step, index) => (
            <div key={index} className="relative">
              <div className={`bg-gradient-to-br ${step.color} rounded-xl p-5 text-white shadow-lg h-full`}>
                <div className="flex items-center gap-3 mb-3">
                  {step.icon}
                  <h3 className="font-bold text-lg">{step.title}</h3>
                </div>
                <p className="text-sm text-white/90 mb-4">{step.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white/70 uppercase">Outputs:</p>
                  {step.outputs.map((output, i) => (
                    <p key={i} className="text-xs text-white/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {output}
                    </p>
                  ))}
                </div>
              </div>
              {index < pipelineSteps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scraping Order */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Scraping Order</h2>
        <div className="space-y-3">
          {scrapingOrder.map((retailer, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {retailer.priority}
                </span>
                <span className="font-medium text-gray-800">{retailer.name}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                retailer.status === 'Active' 
                  ? 'bg-green-100 text-green-700' 
                  : retailer.status === 'API Access Pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {retailer.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Rules */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">⚡ Key Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "One row = one product flavor (no duplicates for different bag sizes)",
            "Missing values = empty cell (never null, never N/A)",
            "Main Meat Category auto-tagged: chicken, duck, rabbit, lamb, pork, veal, venison, other meats, vegetarian",
            "COLUMNS list is single source of truth — add columns there before scraping",
            "Data exportable to Google Sheets via CSV (UTF-8 BOM)",
            "ships_to_greece = true only if shipping page explicitly mentions Greece",
          ].map((rule, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
