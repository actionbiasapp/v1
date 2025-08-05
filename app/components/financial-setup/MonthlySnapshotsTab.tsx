'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MonthlySnapshot as MonthlySnapshotType } from '@/app/lib/types/shared';
import { YearlyData } from '@/app/lib/types/shared';

interface MonthlySnapshotsTabProps {
  portfolioTotal?: number;
  displayCurrency?: string;
  yearlyData?: YearlyData[];
}

type SortKey = keyof MonthlySnapshotType;
type SortDirection = 'asc' | 'desc';

export function MonthlySnapshotsTab({ portfolioTotal = 0, displayCurrency = 'SGD', yearlyData = [] }: MonthlySnapshotsTabProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlySnapshotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<MonthlySnapshotType | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedItems, setDisplayedItems] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLTableRowElement | null>(null);
  
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    income: 0,
    expenses: 0,
    portfolioValue: portfolioTotal,
    netWorth: portfolioTotal,
    notes: ''
  });

  useEffect(() => {
    loadMonthlyData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      portfolioValue: portfolioTotal,
      netWorth: portfolioTotal
    }));
  }, [portfolioTotal]);

  const loadMonthlyData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monthly-snapshot');
      const data = await response.json();
      if (data.success) {
        setMonthlyData(data.data);
      }
    } catch (error) {
      console.error('Failed to load monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingSnapshot ? 'PUT' : 'POST';
      const response = await fetch('/api/monthly-snapshot', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await loadMonthlyData();
        setShowAddForm(false);
        setEditingSnapshot(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save monthly snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (snapshot: MonthlySnapshotType) => {
    if (!confirm(`Delete snapshot for ${getMonthName(snapshot.month)} ${snapshot.year}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/monthly-snapshot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: snapshot.year,
          month: snapshot.month
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadMonthlyData();
      }
    } catch (error) {
      console.error('Failed to delete monthly snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (snapshot: MonthlySnapshotType) => {
    setEditingSnapshot(snapshot);
    setFormData({
      year: snapshot.year,
      month: snapshot.month,
      income: snapshot.income,
      expenses: snapshot.expenses,
      portfolioValue: snapshot.portfolioValue,
      netWorth: snapshot.netWorth,
      notes: snapshot.notes || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      income: 0,
      expenses: 0,
      portfolioValue: portfolioTotal,
      netWorth: portfolioTotal,
      notes: ''
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  };

  const getFullMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Format currency with thousand separators and no decimals
  const formatCurrency = (amount: number) => {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  };

  // Check if notes are just duplicating the month/year info
  const isDuplicateNote = (notes: string, month: number, year: number) => {
    const monthName = getMonthName(month).toLowerCase();
    const fullMonthName = getFullMonthName(month).toLowerCase();
    const yearStr = year.toString();
    const notesLower = notes.toLowerCase();
    
    // Check if notes just contain the month name and/or year
    const duplicatePatterns = [
      `${monthName} snapshot`,
      `${monthName} ${year}`,
      `${fullMonthName} snapshot`,
      `${fullMonthName} ${year}`,
      `month ${month}`,
      `month ${month} ${year}`
    ];
    
    // Check for auto-generated notes
    const autoGeneratedPatterns = [
      'auto-generated',
      'auto generated',
      'auto-populated',
      'auto populated'
    ];
    
    // Only filter out if the notes exactly match or are very close to these patterns
    const isDuplicatePattern = duplicatePatterns.some(pattern => {
      const trimmedNotes = notesLower.trim();
      return trimmedNotes === pattern || 
             trimmedNotes === `${pattern} snapshot` ||
             trimmedNotes === `${pattern} 2024` ||
             trimmedNotes === `${pattern} 2025`;
    });
    
    // Check for auto-generated patterns
    const isAutoGenerated = autoGeneratedPatterns.some(pattern => 
      notesLower.includes(pattern)
    );
    
    return isDuplicatePattern || isAutoGenerated;
  };

  // Auto-populate monthly data from annual data
  const populateFromAnnualData = async (year: number) => {
    const yearData = yearlyData.find(y => y.year === year);
    if (!yearData) {
      alert(`No annual data found for ${year}`);
      return;
    }

    const monthlyIncome = yearData.income / 12;
    const monthlyExpenses = yearData.expenses / 12;
    const monthlySavings = yearData.savings / 12;
    const monthlyNetWorth = yearData.netWorth / 12;

    setLoading(true);
    try {
      // Create 12 monthly snapshots for the year
      const promises = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return fetch('/api/monthly-snapshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year,
            month,
            income: monthlyIncome,
            expenses: monthlyExpenses,
            portfolioValue: monthlyNetWorth, // Using net worth as portfolio value
            netWorth: monthlyNetWorth,
            notes: `Auto-generated from ${year} annual data`
          })
        });
      });

      await Promise.all(promises);
      await loadMonthlyData();
      alert(`Successfully created 12 monthly snapshots for ${year}`);
    } catch (error) {
      console.error('Failed to populate monthly data:', error);
      alert('Failed to populate monthly data');
    } finally {
      setLoading(false);
    }
  };

  // Sorting functionality
  const requestSort = (key: keyof MonthlySnapshotType) => {
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(direction);
  };

  const getSortIndicator = (key: keyof MonthlySnapshotType) => {
    if (sortKey !== key) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Filter and sort data
  const filteredData = monthlyData.filter(snapshot => {
    const searchLower = searchTerm.toLowerCase();
    const monthName = getMonthName(snapshot.month).toLowerCase();
    const yearStr = snapshot.year.toString();
    const notes = (snapshot.notes || '').toLowerCase();
    
    return monthName.includes(searchLower) || 
           yearStr.includes(searchLower) || 
           notes.includes(searchLower);
  });

  const sortedData = [...filteredData].sort((a, b) => {
    // Primary sort by year, secondary by month
    if (a.year !== b.year) {
      return sortDirection === 'asc' ? a.year - b.year : b.year - a.year;
    }
    
    // If same year, sort by month
    return sortDirection === 'asc' ? a.month - b.month : b.month - a.month;
  });

  // Infinite scroll functionality
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedItems(prev => Math.min(prev + 20, sortedData.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, sortedData.length]);

  const lastItemRefCallback = useCallback((node: HTMLTableRowElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayedItems < sortedData.length) {
        loadMoreItems();
      }
    });
    
    if (node) observerRef.current.observe(node);
    lastItemRef.current = node;
  }, [displayedItems, sortedData.length, loadMoreItems]);

  // Calculate savings and rate for display
  const getSavingsData = (snapshot: MonthlySnapshotType) => {
    const savings = snapshot.income - snapshot.expenses;
    const savingsRate = snapshot.income > 0 ? (savings / snapshot.income) * 100 : 0;
    return { savings, savingsRate };
  };

  if (loading && monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by month, year, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const year = prompt('Enter year to populate from annual data:');
              if (year && !isNaN(Number(year))) {
                populateFromAnnualData(Number(year));
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 font-medium whitespace-nowrap"
            title="Auto-populate monthly data from annual data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto-Populate
          </button>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingSnapshot(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Snapshot
          </button>
        </div>
      </div>

      {/* Table - Responsive design with sticky header */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
        <div className="overflow-auto" style={{ maxHeight: '400px' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-700/30 shadow-sm">
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors bg-gray-700/30"
                  onClick={() => requestSort('year')}
                >
                  <div className="flex items-center gap-2">
                    Period
                    <span className="text-gray-500">{getSortIndicator('year')}</span>
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors bg-gray-700/30"
                  onClick={() => requestSort('income')}
                >
                  <div className="flex items-center gap-2">
                    Income
                    <span className="text-gray-500">{getSortIndicator('income')}</span>
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors bg-gray-700/30"
                  onClick={() => requestSort('expenses')}
                >
                  <div className="flex items-center gap-2">
                    Expenses
                    <span className="text-gray-500">{getSortIndicator('expenses')}</span>
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors bg-gray-700/30"
                >
                  <div className="flex items-center gap-2">
                    Savings
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors bg-gray-700/30"
                  onClick={() => requestSort('netWorth')}
                >
                  <div className="flex items-center gap-2">
                    Net Worth
                    <span className="text-gray-500">{getSortIndicator('netWorth')}</span>
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider bg-gray-700/30">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {sortedData.slice(0, displayedItems).map((snapshot, index) => {
                const savingsData = getSavingsData(snapshot);
                const isLastItem = index === displayedItems - 1;
                
                return (
                  <tr 
                    key={snapshot.id} 
                    className="hover:bg-gray-700/20 transition-colors"
                    ref={isLastItem ? lastItemRefCallback : null}
                  >
                    <td className="px-3 py-2 text-sm text-white font-medium">
                      <div className="flex flex-col">
                        <span>{snapshot.year} - {getMonthName(snapshot.month)}</span>
                        {snapshot.notes && !isDuplicateNote(snapshot.notes, snapshot.month, snapshot.year) && (
                          <span className="text-xs text-gray-400 truncate max-w-[120px]" title={snapshot.notes}>
                            {snapshot.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      {formatCurrency(snapshot.income)}
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      {formatCurrency(snapshot.expenses)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className="font-medium text-emerald-400">
                        {formatCurrency(savingsData.savings)} ({savingsData.savingsRate.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-white font-semibold">
                      {formatCurrency(snapshot.netWorth)}
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(snapshot)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-600 rounded-lg transition-all duration-200"
                          title="Edit snapshot"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(snapshot)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-600 rounded-lg transition-all duration-200"
                          title="Delete snapshot"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* End of Results Indicator - Inside table */}
              {displayedItems >= sortedData.length && sortedData.length > 0 && (
                <tr className="bg-gray-700/10">
                  <td colSpan={6} className="px-3 py-3 text-center text-gray-400 text-sm">
                    All {sortedData.length} snapshots loaded
                  </td>
                </tr>
              )}
              
              {/* Loading More Indicator - Inside table */}
              {isLoadingMore && (
                <tr className="bg-gray-700/10">
                  <td colSpan={6} className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-400 text-sm">Loading more...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State - Apple-style */}
      {monthlyData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No monthly snapshots yet</h3>
          <p className="text-gray-400 mb-6">Start tracking your monthly financial progress</p>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingSnapshot(null);
              resetForm();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Add Your First Snapshot
          </button>
        </div>
      )}

      {/* No Results State */}
      {monthlyData.length > 0 && filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No snapshots found</h3>
          <p className="text-gray-400">Try adjusting your search terms</p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-white font-medium mb-4">
              {editingSnapshot ? 'Edit Monthly Snapshot' : 'Add Monthly Snapshot'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    min="2020"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{getMonthName(month)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Income ({displayCurrency})
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(formData.income)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[$,]/g, '');
                      const numValue = Number(value) || 0;
                      setFormData({...formData, income: numValue});
                    }}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    placeholder="$0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expenses ({displayCurrency})
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(formData.expenses)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[$,]/g, '');
                      const numValue = Number(value) || 0;
                      setFormData({...formData, expenses: numValue});
                    }}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    placeholder="$0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Net Worth ({displayCurrency})
                </label>
                <input
                  type="text"
                  value={formatCurrency(formData.netWorth)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[$,]/g, '');
                    const numValue = Number(value) || 0;
                    setFormData({...formData, netWorth: numValue});
                  }}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  placeholder="$0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>

              {/* Summary */}
              {(() => {
                const savings = formData.income - formData.expenses;
                const savingsRate = formData.income > 0 ? (savings / formData.income) * 100 : 0;
                return (
                  <div className="bg-slate-600/30 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-400">
                          {formatCurrency(savings)}
                        </div>
                        <div className="text-xs text-slate-400">Savings</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">
                          {savingsRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">Savings Rate</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingSnapshot ? 'Update' : 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSnapshot(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 