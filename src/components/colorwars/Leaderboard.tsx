import React, { useRef, useEffect, useState } from "react";
import VotesSummary from "./VotesSummary";
import { ColorData } from "../../lib/types";

interface LeaderboardItem extends ColorData {
  wins: number;
  matches: number;
}

interface LeaderboardProps {
  colors: LeaderboardItem[];
}

export default function Leaderboard({ colors }: LeaderboardProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const ITEMS_PER_PAGE = 50;

  const sortedColors = React.useMemo(() => {
    if (!Array.isArray(colors)) return [];

    return [...colors]
      .filter(
        (color): color is LeaderboardItem =>
          color &&
          typeof color.matches === "number" &&
          color.matches > 0 &&
          typeof color.wins === "number"
      )
      .sort((a, b) => {
        const aWinRate = a.wins / a.matches;
        const bWinRate = b.wins / b.matches;

        if (Math.abs(aWinRate - bWinRate) < 0.0001) {
          return b.matches - a.matches;
        }

        return bWinRate - aWinRate;
      });
  }, [colors]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          !isLoading &&
          displayCount < sortedColors.length
        ) {
          setIsLoading(true);
          // Simulate loading delay for smoother UX
          setTimeout(() => {
            setDisplayCount((prev) =>
              Math.min(prev + ITEMS_PER_PAGE, sortedColors.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, sortedColors.length, isLoading]);

  if (sortedColors.length === 0) {
    return (
      <div className="text-center text-gray-600">
        No ranked colors yet. Start voting to see colors appear here!
      </div>
    );
  }

  // Generate a unique key for each color item
  const getUniqueKey = (item: LeaderboardItem, index: number) => {
    return `${item.id}-${item.color}-${item.owner}-${index}`;
  };

  const displayedColors = sortedColors.slice(0, displayCount);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <VotesSummary colors={sortedColors} />

      <div>
        <h2 className="text-xl font-bold mb-4 text-center">Global Rankings</h2>
        <div className="space-y-3">
          {displayedColors.map((item, index) => (
            <div
              key={getUniqueKey(item, index)}
              className="bg-white rounded-lg shadow-sm p-3 flex items-center gap-3"
            >
              <div className="font-bold text-lg min-w-[1.5rem]">
                {index + 1}
              </div>
              <div
                className="w-12 h-12 rounded shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-grow">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-bold text-sm truncate">{item.name}</h3>
                  <span className="text-xs text-gray-500 font-mono truncate">
                    {item.color}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Win rate: {((item.wins / item.matches) * 100).toFixed(1)}%
                  <span className="ml-1">
                    ({item.wins}/{item.matches} matches)
                  </span>
                </p>
              </div>
            </div>
          ))}

          {displayCount < sortedColors.length && (
            <div ref={loadMoreRef} className="py-4 text-center">
              {isLoading ? (
                <div className="flex justify-center items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span className="text-gray-600">Loading more...</span>
                </div>
              ) : (
                <span className="text-gray-500">
                  Scroll for more ({displayCount} of {sortedColors.length})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
