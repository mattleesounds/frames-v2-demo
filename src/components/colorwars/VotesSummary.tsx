import React from "react";

interface VotesSummaryProps {
  colors: Array<{
    matches: number;
  }>;
}

const VotesSummary = ({ colors }: VotesSummaryProps) => {
  const totalVotes = React.useMemo(() => {
    if (!Array.isArray(colors)) return 0;
    // Calculate total number of unique matches
    // Since each match is counted for both winner and loser, divide total by 2
    return Math.floor(
      colors.reduce((sum, color) => sum + (color?.matches || 0), 0) / 2
    );
  }, [colors]);

  return (
    <div className="text-center mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-1">Total Votes Cast</h3>
        <p className="text-3xl font-bold text-neutral-900">
          {totalVotes.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          from {colors.length.toLocaleString()} unique colors
        </p>
      </div>
    </div>
  );
};

export default VotesSummary;
