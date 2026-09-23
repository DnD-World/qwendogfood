import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { sampleProducts, DogFoodProduct } from '../data/sampleData';
import { COLUMNS, MEAT_CATEGORIES } from '../data/schema';

export default function DatabaseView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMeat, setFilterMeat] = useState('');
  const [filterGrainFree, setFilterGrainFree] = useState('');
  const [filterLifeStage, setFilterLifeStage] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Get unique values for filters
  const brands = useMemo(() => [...new Set(sampleProducts.map(p => p.brand))].sort(), []);
  const types = useMemo(() => [...new Set(sampleProducts.map(p => p.product_type))].sort(), []);
  const lifeStages = useMemo(() => [...new Set(sampleProducts.map(p => p.life_stage).filter(Boolean))].sort(), []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let results = [...sampleProducts];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(p =>
        Object.values(p).some(v => v.toLowerCase().includes(term))
      );
    }

    // Filters
    if (filterBrand) results = results.filter(p => p.brand === filterBrand);
    if (filterType) results = results.filter(p => p.product_type === filterType);
    if (filterMeat) results = results.filter(p => p.main_meat_category === filterMeat);
    if (filterGrainFree) results = results.filter(p => p.grain_free === filterGrainFree);
    if (filterLifeStage) results = results.filter(p => p.life_stage === filterLifeStage);

    // Sort
    if (sortKey) {
      results.sort((a, b) => {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        const numA = parseFloat(aVal);
        const numB = parseFloat(bVal);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }
        return sortDir === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      });
    }

    return results;
  }, [searchTerm, filterBrand, filterType, filterMeat, filterGrainFree, filterLifeStage, sortKey, sortDir]);

  // CSV Export
  const exportCSV = () => {
    const headers = COLUMNS.map(c => c.header);
    const keys = COLUMNS.map(c => c.key);
    
    const rows = filteredProducts.map(product => 
      keys.map(key => {
        const val = product[key] || '';
        // Escape quotes and wrap in quotes if contains comma
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dogfood_database_greece.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Visible columns for the table (subset for readability)
  const visibleColumns = [
    { key: 'brand', label: 'Brand' },
    { key: 'product_name', label: 'Product' },
    { key: 'product_type', label: 'Type' },
    { key: 'flavor_variant', label: 'Flavor' },
    { key: 'main_meat_category', label: 'Meat' },
    { key: 'grain_free', label: 'Grain-Free' },
    { key: 'crude_protein_pct', label: 'Protein %' },
    { key: 'price', label: 'Price' },
    { key: 'price_per_kg', label: '€/kg' },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            Search Database
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {filteredProducts.length} of {sampleProducts.length} products
            </span>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands, products, ingredients, flavors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Filters:</span>
          </div>
          
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterMeat}
            onChange={(e) => setFilterMeat(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Meats</option>
            {MEAT_CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={filterGrainFree}
            onChange={(e) => setFilterGrainFree(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Grains</option>
            <option value="Yes">Grain-Free</option>
            <option value="No">Contains Grains</option>
          </select>

          <select
            value={filterLifeStage}
            onChange={(e) => setFilterLifeStage(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Life Stages</option>
            {lifeStages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {(filterBrand || filterType || filterMeat || filterGrainFree || filterLifeStage || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBrand('');
                setFilterType('');
                setFilterMeat('');
                setFilterGrainFree('');
                setFilterLifeStage('');
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                {visibleColumns.map(col => (
                  <th
                    key={col.key}
                    className="text-left py-3 px-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        sortDir === 'asc' 
                          ? <ChevronUp className="w-3 h-3" /> 
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                      expandedRow === index ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">{product.brand}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate">{product.product_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        product.product_type === 'Treat' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{product.flavor_variant}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 capitalize">
                        {product.main_meat_category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {product.grain_free === 'Yes' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓ GF</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Grains</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">{product.crude_protein_pct}%</td>
                    <td className="py-3 px-4 font-mono text-gray-800 font-semibold">€{product.price}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{product.price_per_kg ? `€${product.price_per_kg}` : '—'}</td>
                    <td className="py-3 px-4">
                      {expandedRow === index ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </td>
                  </tr>
                  
                  {/* Expanded Row Detail */}
                  {expandedRow === index && (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="bg-gray-50 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <DetailItem label="Product Line" value={product.product_line} />
                          <DetailItem label="Life Stage" value={product.life_stage} />
                          <DetailItem label="Breed Size" value={product.breed_size} />
                          <DetailItem label="Special Condition" value={product.special_condition} />
                          <DetailItem label="Crude Fat %" value={product.crude_fat_pct} />
                          <DetailItem label="Crude Fiber %" value={product.crude_fiber_pct} />
                          <DetailItem label="Crude Ash %" value={product.crude_ash_pct} />
                          <DetailItem label="Omega-3 %" value={product.omega3_pct} />
                          <DetailItem label="Omega-6 %" value={product.omega6_pct} />
                          <DetailItem label="Energy kcal/kg" value={product.metabolizable_energy_kcal} />
                          <DetailItem label="Country" value={product.country_of_origin} />
                          <DetailItem label="Package" value={product.package_weight} />
                          <DetailItem label="Vitamin A" value={product.vitamin_a} />
                          <DetailItem label="Vitamin D3" value={product.vitamin_d3} />
                          <DetailItem label="Vitamin E" value={product.vitamin_e} />
                          <DetailItem label="Fresh Meat %" value={product.fresh_meat_inclusion_pct} />
                        </div>
                        {product.full_ingredient_list && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Ingredients:</p>
                            <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 max-h-20 overflow-y-auto">
                              {product.full_ingredient_list}
                            </p>
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          {product.product_url && (
                            <a
                              href={product.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Product Page
                            </a>
                          )}
                          {product.brand_site_url && (
                            <a
                              href={product.brand_site_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Brand Site
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-gray-400 font-medium">{label}</p>
      <p className="text-gray-700">{value}</p>
    </div>
  );
}
