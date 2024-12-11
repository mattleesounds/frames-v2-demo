import { createPublicClient, http, getAddress } from "viem";
import { base } from "viem/chains";
import type { ColorData } from "../lib/types";

const CONTRACT_ADDRESS = getAddress(
  "0x7Bc1C072742D8391817EB4Eb2317F98dc72C61dB"
) as `0x${string}`;

const ABI = [
  {
    name: "currentTokenId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "tokenIdToColor",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "getAttributesAsJson",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
  batch: {
    multicall: true,
  },
});

interface Attribute {
  trait_type: string;
  value: string;
}

export class BaseColorsService {
  private static maxTokenId: number | null = null;

  static async fetchRandomPair(): Promise<[ColorData, ColorData]> {
    try {
      // Get max token ID if we don't have it
      if (this.maxTokenId === null) {
        const totalSupply = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "currentTokenId",
        });
        this.maxTokenId = Number(totalSupply);
      }

      // Generate two random token IDs
      const id1 = Math.floor(Math.random() * this.maxTokenId);
      let id2;
      do {
        id2 = Math.floor(Math.random() * this.maxTokenId);
      } while (id2 === id1);

      // Fetch both colors in parallel
      const [color1, color2] = await Promise.all([
        this.fetchSingleColor(BigInt(id1)),
        this.fetchSingleColor(BigInt(id2)),
      ]);

      return [color1, color2];
    } catch (error) {
      console.error("Error fetching random pair:", error);
      throw new Error("Failed to fetch random color pair. Please try again.");
    }
  }

  private static async fetchSingleColor(tokenId: bigint): Promise<ColorData> {
    try {
      // Fetch all data for this token in a single multicall
      const [color, attributesJson, owner] = await Promise.all([
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "tokenIdToColor",
          args: [tokenId],
        }),
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "getAttributesAsJson",
          args: [tokenId],
        }),
        client.readContract({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: "ownerOf",
          args: [tokenId],
        }),
      ]);

      const attributes = JSON.parse(attributesJson as string) as Attribute[];
      const nameAttribute = attributes.find(
        (attr) => attr.trait_type === "Color Name"
      );

      return {
        id: Number(tokenId),
        color: color as string,
        name: nameAttribute?.value || (color as string),
        owner: owner as string,
        wins: 0,
        matches: 0,
      };
    } catch (error) {
      console.error(`Error fetching color ${tokenId}:`, error);
      return {
        id: Number(tokenId),
        color: "#000000",
        name: `Color #${tokenId}`,
        owner: "0x0000000000000000000000000000000000000000",
        wins: 0,
        matches: 0,
      };
    }
  }
}
