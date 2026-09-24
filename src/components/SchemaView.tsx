import React from 'react';
import { COLUMNS, GROUPS } from '../data/schema';
import { Table, Hash } from 'lucide-react';

const groupColors: Record<string, string> = {
  "Identity": "bg-blue-100 text-blue-800 border-blue-200",
  "Target": "bg-purple-100 text-purple-800 border-purple-200",
  "Protein": "bg-red-100 text-red-800 border-red-200",
  "Ingredients": "bg-green-100 text-green-800 border-green-200",
  "Analytical": "bg-amber-100 text-amber-800 border-amber-200",
  "Additives": "bg-teal-100 text-teal-800 border-teal-200",
  "Energy": "bg-orange-100 text-orange-800 border-orange-200",
  "Commercial": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Shipping": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Monetization": "bg-pink-100 text-pink-800 border-pink-200",
};

export default function SchemaView() {
  return (
    <div className="space-y-6">
      {/* Schema Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Table className="w-6 h-6 text-blue-600" />
          Database Schema
        </h2>
        <p className="text-gray-600 mb-4">
          <strong>{COLUMNS.length} columns</strong> across <strong>{GROUPS.length} groups</strong>. 
          One row = one product flavor. This is the single source of truth.
        </p>

        {/* Group Summary */}
        <div className="flex flex-wrap gap-2 mb-6">
          {GROUPS.map(group => (
            <span
              key={group}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${groupColors[group] || 'bg-gray-100 text-gray-700'}`}
            >
              {group} ({COLUMNS.filter(c => c.group === group).length})
            </span>
          ))}
        </div>
      </div>

      {/* Full Column List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-gray-500" />
          All Columns
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Group</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Header</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Key</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((col, index) => (
                <tr
                  key={col.key}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2.5 px-4 text-gray-400 font-mono text-xs">{index + 1}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${groupColors[col.group] || 'bg-gray-100'}`}>
                      {col.group}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-gray-800">{col.header}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{col.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema JSON */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📄 Schema JSON</h3>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed max-h-96">
          {JSON.stringify(COLUMNS, null, 2)}
        </pre>
      </div>
    </div>
  );
}
