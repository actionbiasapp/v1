'use client';

import { useState, useEffect } from 'react';
import { FIMilestone } from '@/app/lib/fiTargets';
import { formatCurrency } from '@/app/lib/currency';
import { APP_CONFIG } from '@/app/lib/config';

interface FIMilestonesTabProps {
  milestones: FIMilestone[];
  onMilestonesChange: (milestones: FIMilestone[]) => void;
}

export function FIMilestonesTab({ milestones, onMilestonesChange }: FIMilestonesTabProps) {
  const [editingMilestone, setEditingMilestone] = useState<FIMilestone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    amount: '',
    description: ''
  });

  const handleAddMilestone = async () => {
    if (!newMilestone.name || !newMilestone.amount) return;

    try {
      const response = await fetch('/api/fi-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMilestone.name,
          amount: parseFloat(newMilestone.amount),
          description: newMilestone.description || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onMilestonesChange([...milestones, data.milestone]);
          setNewMilestone({ name: '', amount: '', description: '' });
          setShowAddForm(false);
        }
      }
    } catch (error) {
      console.error('Failed to add milestone:', error);
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone) return;

    try {
      const response = await fetch('/api/fi-milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMilestone.id,
          name: editingMilestone.name,
          amount: editingMilestone.amount,
          description: editingMilestone.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedMilestones = milestones.map(m => 
            m.id === editingMilestone.id ? data.milestone : m
          );
          onMilestonesChange(updatedMilestones);
          setEditingMilestone(null);
        }
      }
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const response = await fetch(`/api/fi-milestones?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedMilestones = milestones.filter(m => m.id !== id);
          onMilestonesChange(updatedMilestones);
        }
      }
    } catch (error) {
      console.error('Failed to delete milestone:', error);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">FI Milestones</h3>
          <p className="text-sm text-slate-400">
            Set custom milestones for your Financial Independence journey
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Milestone
        </button>
      </div>

      {/* Add New Milestone Form */}
      {showAddForm && (
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <h4 className="text-white font-medium mb-4">Add New Milestone</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="e.g., My First Million"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Amount (SGD)</label>
              <input
                type="number"
                value={newMilestone.amount}
                onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                placeholder={APP_CONFIG.FINANCIAL.FI_TARGETS.FIRST_MILLION.toString()}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddMilestone}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Milestone
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewMilestone({ name: '', amount: '', description: '' });
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-3">
        {sortedMilestones.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No custom milestones set. Add your first milestone to get started!</p>
          </div>
        ) : (
          sortedMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
            >
              {editingMilestone?.id === milestone.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={editingMilestone.name}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Amount (SGD)</label>
                      <input
                        type="number"
                        value={editingMilestone.amount}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, amount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Description</label>
                      <input
                        type="text"
                        value={editingMilestone.description || ''}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateMilestone}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMilestone(null)}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">{milestone.name}</h4>
                    <p className="text-blue-400 font-semibold">
                      {formatCurrency(milestone.amount, 'SGD')}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-slate-400 mt-1">{milestone.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingMilestone(milestone)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Default Milestones Info */}
      <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
        <h4 className="text-white font-medium mb-2">Default Milestones</h4>
        <p className="text-sm text-slate-400 mb-3">
          If no custom milestones are set, the system will use these default targets:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-300">First Million:</span>
            <span className="text-blue-400 ml-2">{formatCurrency(APP_CONFIG.FINANCIAL.FI_TARGETS.FIRST_MILLION, 'SGD')}</span>
          </div>
          <div>
            <span className="text-slate-300">Lean FI:</span>
            <span className="text-blue-400 ml-2">{formatCurrency(APP_CONFIG.FINANCIAL.FI_TARGETS.LEAN_FI, 'SGD')}</span>
          </div>
          <div>
            <span className="text-slate-300">Full FI:</span>
            <span className="text-blue-400 ml-2">{formatCurrency(APP_CONFIG.FINANCIAL.FI_TARGETS.FULL_FI, 'SGD')}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 