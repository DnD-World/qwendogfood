import React, { useState } from 'react';
import { Database, Code2, Table2, LayoutDashboard, Menu, X } from 'lucide-react';
import ArchitectureView from './components/ArchitectureView';
import SchemaView from './components/SchemaView';
import ScraperCodeView from './components/ScraperCodeView';
import DatabaseView from './components/DatabaseView';

type Tab = 'architecture' | 'schema' | 'code' | 'database';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'architecture', label: 'Architecture', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'schema', label: 'Schema', icon: <Table2 className="w-4 h-4" /> },
  { id: 'code', label: 'Scraper Code', icon: <Code2 className="w-4 h-4" /> },
  { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('architecture');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🐕</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">DogFoodDB</h1>
                <p className="text-xs text-gray-500 leading-tight">Greece & EU Retailers</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {activeTab === 'architecture' && '🏗️ Pipeline Architecture'}
            {activeTab === 'schema' && '📊 Database Schema'}
            {activeTab === 'code' && '🐍 Zooplus.gr Scraper'}
            {activeTab === 'database' && '🔍 Searchable Database'}
          </h2>
          <p className="text-gray-500 mt-1">
            {activeTab === 'architecture' && 'Hybrid scraping pipeline: Retailer → Brand → Merger → CSV'}
            {activeTab === 'schema' && '47 columns across 10 groups — single source of truth'}
            {activeTab === 'code' && 'Python scraper with requests + BeautifulSoup + Selenium fallback'}
            {activeTab === 'database' && 'Sample data from Zooplus.gr scrape — search, filter, and export'}
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'schema' && <SchemaView />}
        {activeTab === 'code' && <ScraperCodeView />}
        {activeTab === 'database' && <DatabaseView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>🐕</span>
              <span>DogFoodDB Greece — Designed by Lambros</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Scraping: Zooplus.gr → Petshop.gr → Amazon → BestPrice → Brand Sites</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
