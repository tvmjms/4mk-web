// components/SustainabilityDashboard.tsx
// Environmental impact tracking for media optimization

import React from 'react';

interface SustainabilityStats {
  totalFilesOptimized: number;
  totalBandwidthSaved: number; // bytes
  totalCarbonSaved: number; // grams CO2
  averageCompressionRatio: number;
  topOptimizations: Array<{
    filename: string;
    savingsPercent: number;
    carbonSaved: string;
  }>;
}

interface SustainabilityDashboardProps {
  stats: SustainabilityStats;
  className?: string;
}

export default function SustainabilityDashboard({ stats, className = '' }: SustainabilityDashboardProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCarbonSavings = (grams: number): string => {
    if (grams < 1) return `${(grams * 1000).toFixed(0)}mg CO₂`;
    if (grams < 1000) return `${grams.toFixed(1)}g CO₂`;
    return `${(grams / 1000).toFixed(2)}kg CO₂`;
  };

  const getSustainabilityScore = (): { score: string; color: string; message: string } => {
    if (stats.averageCompressionRatio >= 3) {
      return {
        score: 'Excellent',
        color: 'text-green-600 bg-green-100',
        message: 'Your optimizations are making a significant positive impact!'
      };
    } else if (stats.averageCompressionRatio >= 2) {
      return {
        score: 'Good',
        color: 'text-blue-600 bg-blue-100',
        message: 'Great job reducing environmental impact!'
      };
    } else if (stats.averageCompressionRatio >= 1.5) {
      return {
        score: 'Fair',
        color: 'text-yellow-600 bg-yellow-100',
        message: 'Some optimization achieved, room for improvement.'
      };
    } else {
      return {
        score: 'Poor',
        color: 'text-orange-600 bg-orange-100',
        message: 'Consider uploading smaller or more optimized files.'
      };
    }
  };

  const sustainabilityScore = getSustainabilityScore();

  if (stats.totalFilesOptimized === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-2xl mb-2">🌱</div>
          <h3 className="text-sm font-semibold text-green-800">Eco-Friendly Media</h3>
          <p className="text-xs text-green-700 mt-1">
            Upload your first file to see environmental impact savings!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          🌍 Environmental Impact
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${sustainabilityScore.color}`}>
          {sustainabilityScore.score}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {stats.totalFilesOptimized}
          </div>
          <div className="text-xs text-gray-600">Files Optimized</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {formatBytes(stats.totalBandwidthSaved)}
          </div>
          <div className="text-xs text-gray-600">Bandwidth Saved</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {formatCarbonSavings(stats.totalCarbonSaved)}
          </div>
          <div className="text-xs text-gray-600">CO₂ Prevented</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {stats.averageCompressionRatio.toFixed(1)}x
          </div>
          <div className="text-xs text-gray-600">Avg Compression</div>
        </div>
      </div>

      {/* Environmental Equivalents */}
      <div className="bg-white bg-opacity-50 rounded p-2 mb-3">
        <div className="text-xs text-gray-700 text-center">
          <div className="font-medium mb-1">🌱 Environmental Equivalent:</div>
          {stats.totalCarbonSaved > 100 ? (
            <div>
              Saved {(stats.totalCarbonSaved / 404).toFixed(1)} miles of car driving
            </div>
          ) : stats.totalCarbonSaved > 10 ? (
            <div>
              Saved {(stats.totalCarbonSaved / 6.8).toFixed(1)} smartphone charges
            </div>
          ) : (
            <div>
              Every byte saved helps our planet! 🌍
            </div>
          )}
        </div>
      </div>

      {/* Top Optimizations */}
      {stats.topOptimizations.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700">🏆 Best Optimizations:</div>
          {stats.topOptimizations.slice(0, 2).map((opt, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="truncate text-gray-600 max-w-20">
                {opt.filename}
              </span>
              <span className="text-green-600 font-medium">
                -{opt.savingsPercent}% ({opt.carbonSaved})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      <div className="mt-2 text-xs text-center text-gray-600 italic">
        {sustainabilityScore.message}
      </div>
    </div>
  );
}

// Hook to track sustainability stats across the app
export function useSustainabilityTracking() {
  const [stats, setStats] = React.useState<SustainabilityStats>({
    totalFilesOptimized: 0,
    totalBandwidthSaved: 0,
    totalCarbonSaved: 0,
    averageCompressionRatio: 1,
    topOptimizations: []
  });

  const addOptimization = (optimization: {
    filename: string;
    originalSize: number;
    optimizedSize: number;
    carbonSaved: string;
  }) => {
    setStats(prev => {
      const bandwidthSaved = optimization.originalSize - optimization.optimizedSize;
      const compressionRatio = optimization.originalSize / optimization.optimizedSize;
      const carbonGrams = parseFloat(optimization.carbonSaved.replace(/[^\d.]/g, '')) || 0;
      
      const newTopOptimizations = [...prev.topOptimizations, {
        filename: optimization.filename,
        savingsPercent: Math.round((bandwidthSaved / optimization.originalSize) * 100),
        carbonSaved: optimization.carbonSaved
      }].sort((a, b) => b.savingsPercent - a.savingsPercent).slice(0, 5);

      return {
        totalFilesOptimized: prev.totalFilesOptimized + 1,
        totalBandwidthSaved: prev.totalBandwidthSaved + bandwidthSaved,
        totalCarbonSaved: prev.totalCarbonSaved + carbonGrams,
        averageCompressionRatio: (prev.averageCompressionRatio * prev.totalFilesOptimized + compressionRatio) / (prev.totalFilesOptimized + 1),
        topOptimizations: newTopOptimizations
      };
    });
  };

  const resetStats = () => {
    setStats({
      totalFilesOptimized: 0,
      totalBandwidthSaved: 0,
      totalCarbonSaved: 0,
      averageCompressionRatio: 1,
      topOptimizations: []
    });
  };

  return { stats, addOptimization, resetStats };
}