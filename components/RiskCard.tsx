
import React from 'react';
import { AnalysisFinding, RiskLevel } from '../types';
import { AlertTriangle, CheckCircle, XCircle, CheckSquare } from 'lucide-react';

interface RiskCardProps {
  finding: AnalysisFinding;
  isSelected: boolean;
  onClick: () => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ finding, isSelected, onClick }) => {
  const isResolved = finding.status === 'resolved';

  const getColors = (level: RiskLevel) => {
    if (isResolved) return 'bg-gray-50 border-l-4 border-l-gray-400 opacity-75';
    
    switch (level) {
      case RiskLevel.RED:
        return 'border-l-4 border-l-red-500 bg-red-50 hover:bg-red-100';
      case RiskLevel.YELLOW:
        return 'border-l-4 border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100';
      case RiskLevel.GREEN:
        return 'border-l-4 border-l-green-500 bg-green-50 hover:bg-green-100';
      default:
        return 'bg-white';
    }
  };

  const getIcon = (level: RiskLevel) => {
    if (isResolved) return <CheckSquare className="w-5 h-5 text-gray-500" />;

    switch (level) {
      case RiskLevel.RED: return <XCircle className="w-5 h-5 text-red-600" />;
      case RiskLevel.YELLOW: return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case RiskLevel.GREEN: return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer p-4 mb-3 rounded-md shadow-sm border transition-all relative
        ${getColors(finding.risk_level)}
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md transform scale-[1.02] z-10' : 'border-gray-200'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-sm uppercase tracking-wide ${isResolved ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {finding.issue_type}
        </h3>
        {getIcon(finding.risk_level)}
      </div>
      <p className={`text-xs line-clamp-2 ${isResolved ? 'text-gray-400' : 'text-gray-600'}`}>
        {finding.reasoning}
      </p>
      {isResolved && (
         <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded-full font-bold uppercase tracking-wider">
             Resolved
         </div>
      )}
    </div>
  );
};

export default RiskCard;
