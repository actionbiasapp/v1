'use client';

import React, { useState, useCallback } from 'react';
import { PriceDetectionResult } from '../lib/priceDetection';
import { WeightedAverageResult, calculateTotalFromUnits } from '../lib/weightedAverage';

export interface ConfirmedHoldingData {
  quantity: number;
  unitPrice: number;
  totalCost: number;
  enableAutoPricing: boolean;
}

interface HoldingConfirmationProps {
  symbol: string;
  name: string;
  totalAmount: number;
  currency: string;
  priceDetection: PriceDetectionResult;
  weightedAverage: WeightedAverageResult;
  onConfirm: (finalData: ConfirmedHoldingData) => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function HoldingConfirmation({ 
  symbol, 
  name,
  totalAmount,
  currency,
  priceDetection, 
  weightedAverage,
  onConfirm,
  onEdit,
  onCancel 
}: HoldingConfirmationProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(Math.round(weightedAverage.newQuantity));
  const [editedPrice, setEditedPrice] = useState(Number(weightedAverage.newAvgCostBasis.toFixed(2)));
  
  const calculatedTotal = calculateTotalFromUnits(editedQuantity, editedPrice);
  
  const handleConfirm = useCallback((customData?: { quantity: number; unitPrice: number }) => {
    const finalData = customData || {
      quantity: Math.round(weightedAverage.newQuantity),
      unitPrice: weightedAverage.newAvgCostBasis
    };
    
    onConfirm({
      quantity: finalData.quantity,
      unitPrice: finalData.unitPrice,
      totalCost: calculateTotalFromUnits(finalData.quantity, finalData.unitPrice),
      enableAutoPricing: priceDetection.supportsAutoPricing
    });
  }, [weightedAverage, priceDetection, onConfirm]);
  
  if (editMode) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-amber-500/30 mb-4">
        <h4 className="text-amber-400 font-medium mb-3">Edit Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Price per Unit ({currency}):</label>
            <input
              type="number"
              step="0.01"
              value={editedPrice}
              onChange={(e) => setEditedPrice(Number(e.target.value))}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Number of Units:</label>
            <input
              type="number"
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(Number(e.target.value))}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Calculated Total:</span>
            <span className="text-white font-medium">{currency} {calculatedTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">Original Amount:</span>
            <span className="text-gray-400">{currency} {totalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleConfirm({ quantity: editedQuantity, unitPrice: editedPrice })}
            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Save Manual Override
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30 mb-4">
      <h4 className="text-blue-400 font-medium mb-3">Confirm Holdings Details</h4>
      
      {weightedAverage.isNewHolding ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">{symbol} - {name}</span>
            <span className={`text-sm px-2 py-1 rounded ${
              priceDetection.supportsAutoPricing ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {priceDetection.supportsAutoPricing ? '🟢 Auto-pricing' : '🔄 Manual'}
            </span>
          </div>
          
          {priceDetection.currentPrice && (
            <div className="bg-slate-700/50 rounded p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Current Price:</span>
                <span className="text-white">{priceDetection.currency || "USD"} {priceDetection.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Calculated Shares:</span>
                <span className="text-white">{Math.round(weightedAverage.newQuantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Cost:</span>
                <span className="text-white font-medium">{currency} {weightedAverage.newTotalInvested.toLocaleString()}</span>
              </div>
              {Math.abs(weightedAverage.newTotalInvested - totalAmount) > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Original Amount:</span>
                  <span className="text-gray-400">{currency} {totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-amber-400 font-medium">Adding to existing {symbol} position:</div>
          
          <div className="bg-slate-700/50 rounded p-3 space-y-2">
            <div className="text-xs text-gray-400 mb-2">Current Position:</div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Shares:</span>
              <span className="text-white">{weightedAverage.existingData?.currentQuantity || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Avg Cost:</span>
              <span className="text-white">{currency} {(weightedAverage.existingData?.currentAvgPrice || 0).toFixed(2)}</span>
            </div>
            
            <div className="border-t border-slate-600 pt-2 mt-2">
              <div className="text-xs text-gray-400 mb-2">New Total Position:</div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Shares:</span>
                <span className="text-white font-medium">{Math.round(weightedAverage.newQuantity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">New Avg Cost:</span>
                <span className="text-white font-medium">{currency} {weightedAverage.newAvgCostBasis.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Invested:</span>
                <span className="text-white font-medium">{currency} {weightedAverage.newTotalInvested.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleConfirm()}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Confirm & Save
        </button>
        <button
          onClick={() => setEditMode(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          Edit Details
        </button>
        <button
          onClick={onCancel}
          className="bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
