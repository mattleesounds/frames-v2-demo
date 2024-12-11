import React, { useEffect, useState } from "react";
import type { ColorData } from "../../lib/types";
import { ENSService } from "../../lib/ens-service";

interface ColorPairProps {
  pair: [ColorData, ColorData];
  onVote: (winner: ColorData, loser: ColorData) => void;
  className?: string;
}

const ColorPair = ({ pair, onVote, className = "" }: ColorPairProps) => {
  const [resolvedOwners, setResolvedOwners] = useState<Record<string, string>>(
    {}
  );
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const resolveOwners = async () => {
      setIsResolving(true);
      try {
        const addresses = pair.map((color) => color.owner);
        const resolved = await ENSService.batchResolveAddresses(addresses);

        const ownerMap: Record<string, string> = {};
        addresses.forEach((addr, i) => {
          ownerMap[addr] = resolved[i];
        });

        setResolvedOwners(ownerMap);
      } catch (error) {
        console.error("Error resolving owners:", error);
      } finally {
        setIsResolving(false);
      }
    };

    resolveOwners();
  }, [pair]);

  return (
    <div className={`w-full max-w-xl mx-auto px-4 py-6 ${className}`}>
      {/* Question text */}
      <div className="text-center mb-8">
        <p className="text-neutral-600 text-sm mb-2">Which Color Is Better?</p>
        <h2 className="text-xl font-bold">Tap to Choose.</h2>
      </div>

      {/* Colors container */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {pair.map((color) => (
          <button
            key={color.id}
            onClick={() => onVote(color, pair.find((c) => c.id !== color.id)!)}
            className="aspect-square rounded-xl shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400"
            style={{ backgroundColor: color.color }}
            aria-label={`Vote for ${color.name}`}
          />
        ))}
      </div>

      {/* Color info container */}
      <div className="grid grid-cols-2 gap-4">
        {pair.map((color) => (
          <div key={`info-${color.id}`} className="text-center">
            <h3 className="text-lg font-semibold mb-1 break-word hyphens-auto">
              {color.name}
            </h3>
            <p className="font-mono text-sm text-neutral-600 mb-1">
              #{color.color.replace("#", "")}
            </p>
            <p className="text-sm text-neutral-500 break-all">
              Owner:{" "}
              {isResolving ? "..." : resolvedOwners[color.owner] || color.owner}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPair;
