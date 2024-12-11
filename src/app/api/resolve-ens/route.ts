// app/api/resolve-ens/route.ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error("ALCHEMY_API_KEY is not set in environment variables");
}

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  ),
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { addresses } = await req.json();

    if (!Array.isArray(addresses)) {
      return NextResponse.json(
        { error: "Invalid input: addresses must be an array" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (addresses.length > 50) {
      return NextResponse.json(
        { error: "Too many addresses: maximum 50 allowed" },
        { status: 400 }
      );
    }

    const resolvedNames = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const ensName = await mainnetClient.getEnsName({
            address: addr as `0x${string}`,
          });
          return { address: addr, ensName: ensName || addr };
        } catch (error) {
          console.error(`Error resolving ENS for ${addr}:`, error);
          return { address: addr, ensName: addr };
        }
      })
    );

    return NextResponse.json({ resolvedNames });
  } catch (error) {
    console.error("Error in ENS resolution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
