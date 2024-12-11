"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import ColorPair from "./ColorPair";
import Leaderboard from "./Leaderboard";
import { Button } from "./Button";
import type { ColorData } from "../../lib/types";
import { BaseColorsService } from "../../lib/blockchain-service";
import { supabase } from "../../lib/supabase/client";

export default function ColorGame() {
  const queryClient = useQueryClient();
  const hasMounted = useRef(false);
  const [currentPair, setCurrentPair] = useState<[ColorData, ColorData] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all color scores with pagination
  const { data: globalScores, isError: scoresError } = useQuery({
    queryKey: ["colorScores"],
    queryFn: async () => {
      const allScores = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error, count } = await supabase
          .from("color_scores")
          .select("*", { count: "exact" })
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order("matches", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!data || data.length === 0) break;

        allScores.push(...data);

        // If we've fetched all records, break
        if (data.length < pageSize || (count && allScores.length >= count))
          break;

        page++;
      }

      return allScores;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes before garbage collection
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      winner,
      loser,
    }: {
      winner: ColorData;
      loser: ColorData;
    }) => {
      const { error } = await supabase.rpc("record_vote", {
        winner_id: winner.id,
        winner_hex: winner.color,
        winner_name: winner.name,
        winner_owner: winner.owner,
        loser_id: loser.id,
        loser_hex: loser.color,
        loser_name: loser.name,
        loser_owner: loser.owner,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colorScores"] });
      fetchNewPair();
    },
    onError: (error) => {
      console.error("Vote error:", error);
      setError("Failed to record vote. Please try again.");
    },
  });

  const fetchNewPair = async () => {
    try {
      setLoading(true);
      const newPair = await BaseColorsService.fetchRandomPair();
      setCurrentPair(newPair);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load colors";
      setError(`${errorMessage}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (winner: ColorData, loser: ColorData) => {
    if (!hasMounted.current) return;
    voteMutation.mutate({ winner, loser });
  };

  useEffect(() => {
    hasMounted.current = true;
    fetchNewPair();
    return () => {
      hasMounted.current = false;
    };
  }, []);

  if (typeof window === "undefined") return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchNewPair()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100/80 backdrop-blur-sm z-10 px-4 py-4 border-b border-neutral-900 sticky top-0">
        <h1 className="text-2xl font-bold text-center">
          Color{" "}
          <span
            style={{
              backgroundImage:
                "linear-gradient(90deg, #FF0000 0%, #FF8800 20%, #FFFF00 40%, #00FF00 60%, #0088FF 80%, #FF00FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              WebkitTextStroke: "1px black",
              display: "inline",
            }}
          >
            Wars
          </span>
        </h1>
        <p className="text-gray-600 text-sm text-center mt-1">
          Made with{" "}
          <Link
            href="https://www.basecolors.com/"
            className="text-blue-600 hover:text-blue-800"
          >
            Base Colors
          </Link>
        </p>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-xl mx-auto">
          <div className="px-4">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  <p className="mt-4 text-gray-600">Loading new colors...</p>
                </div>
              </div>
            ) : (
              currentPair && (
                <ColorPair pair={currentPair} onVote={handleVote} />
              )
            )}
          </div>

          <div className="px-4 mt-4 mb-4">
            <Button
              variant="secondary"
              onClick={fetchNewPair}
              disabled={loading}
              className="w-full border border-neutral-900 hover:border-neutral-900"
            >
              Skip
            </Button>
          </div>

          <div className="px-4 pb-8">
            {scoresError ? (
              <p className="text-red-600 text-center">
                Failed to load leaderboard
              </p>
            ) : (
              <Leaderboard
                colors={
                  globalScores?.map((score) => ({
                    id: score.color_id,
                    color: score.color_hex,
                    name: score.color_name,
                    owner: score.owner_address,
                    wins: score.wins,
                    matches: score.matches,
                  })) ?? []
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
