import { NextRequest, NextResponse } from "next/server";

// Interfaces for HLP data
interface HLPPosition {
  coin: string;
  szi: string;
  entryPx: string;
  leverage: {
    type: string;
    value: string;
  };
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
  marginUsed: string;
}

interface HLPData {
  address: string;
  totalEquity: string;
  freeCollateral: string;
  totalLockedCollateral: string;
  hlpAssets: Record<string, unknown>;
  openPositions: HLPPosition[];
}

interface RegularPosition {
  position: {
    coin: string;
    entryPx?: string;
    szi: string;
    unrealizedPnl?: string;
    leverage?: { value?: string };
    marginUsed?: string;
  };
}

interface MarginSummary {
  accountValue: string;
  totalNtlPos: string;
  totalRawUsd: string;
  totalMarginUsed: string;
}

interface RegularResponseData {
  marginSummary?: MarginSummary;
  assetPositions?: RegularPosition[];
  withdrawable?: string;
}

interface TransformedResponseData {
  marginSummary: MarginSummary;
  assetPositions: RegularPosition[];
  withdrawable: string;
}

// Fetch vault data from Hyperliquid Info API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaultAddress = searchParams.get("vault");

  if (!vaultAddress) {
    return NextResponse.json({ error: "Missing vault address" }, { status: 400 });
  }

  try {
    const API = "https://api.hyperliquid.xyz/info";
    const trimmedAddress = vaultAddress.trim().toLowerCase();
    
    // Check if this is the HLP vault
    const isHLP = trimmedAddress === "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303";
    
    let responseData: TransformedResponseData;
    let endpointType: string;
    
    if (isHLP) {
      // Use hlpDetails for HLP vault
      console.log(`HLP vault detected: ${trimmedAddress}, using hlpDetails`);
      endpointType = "hlpDetails";
      
      const hlpResponse = await fetch(API, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hlpDetails",
          user: trimmedAddress,
        }),
      });

      if (!hlpResponse.ok) {
        return NextResponse.json(
          { error: `HLP API error: ${hlpResponse.status}` },
          { status: hlpResponse.status }
        );
      }

      const hlpData: HLPData = await hlpResponse.json();
      
      // Transform HLP data to match clearinghouseState format
      responseData = {
        marginSummary: {
          accountValue: hlpData.totalEquity || "0",
          totalNtlPos: "0.0",
          totalRawUsd: hlpData.totalEquity || "0",
          totalMarginUsed: hlpData.totalLockedCollateral || "0"
        },
        // Map HLP openPositions to assetPositions format
        assetPositions: (hlpData.openPositions || []).map((pos: HLPPosition) => ({
          position: {
            coin: pos.coin,
            szi: pos.szi,
            entryPx: pos.entryPx,
            unrealizedPnl: pos.unrealizedPnl,
            leverage: pos.leverage,
            liquidationPx: pos.liquidationPx || "",
            marginUsed: pos.marginUsed
          }
        })),
        withdrawable: hlpData.freeCollateral || "0"
      };
      
    } else {
      // Use clearinghouseState for regular vaults
      console.log(`Regular vault: ${trimmedAddress}, using clearinghouseState`);
      endpointType = "clearinghouseState";
      
      const stateResponse = await fetch(API, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: trimmedAddress,
        }),
      });

      if (!stateResponse.ok) {
        return NextResponse.json(
          { error: `Hyperliquid API error: ${stateResponse.status}` },
          { status: stateResponse.status }
        );
      }

      const regularData: RegularResponseData = await stateResponse.json();
      
      // Ensure all required fields exist
      responseData = {
        marginSummary: regularData.marginSummary || {
          accountValue: "0",
          totalNtlPos: "0.0",
          totalRawUsd: "0",
          totalMarginUsed: "0"
        },
        assetPositions: regularData.assetPositions || [],
        withdrawable: regularData.withdrawable || "0"
      };
    }

    // Extract equity value
    const equity = responseData.marginSummary.accountValue 
      ? parseFloat(responseData.marginSummary.accountValue) 
      : 0;

    // Calculate total unrealized PNL from all positions
    let totalPnl = 0;
    if (responseData.assetPositions && Array.isArray(responseData.assetPositions)) {
      totalPnl = responseData.assetPositions.reduce((sum: number, pos: RegularPosition) => {
        const position = pos.position || pos;
        const unrealizedPnl = parseFloat(position.unrealizedPnl || "0");
        return sum + unrealizedPnl;
      }, 0);
    }

    // Extract total account value and withdrawable
    const accountValue = parseFloat(responseData.marginSummary.accountValue || "0");
    const withdrawable = parseFloat(responseData.withdrawable || "0");

    return NextResponse.json(
      { 
        vaultAddress: trimmedAddress,
        equity,
        accountValue,
        withdrawable,
        totalPnl,
        positions: responseData.assetPositions || [],
        marginSummary: responseData.marginSummary || {},
        endpointUsed: endpointType
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch Hyperliquid data:", error);
    return NextResponse.json(
      { error: "Failed to fetch vault data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}