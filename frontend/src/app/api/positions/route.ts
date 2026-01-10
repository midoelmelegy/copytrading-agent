import { NextRequest, NextResponse } from "next/server";

// Add proper interfaces
interface HLPAsset {
  freeCollateral: string;
  lockedCollateral: string;
  mmr: string;
  interest: string;
  positionNotional: string;
  positionCollateral: string;
}

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
  hlpAssets: Record<string, HLPAsset>;
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

interface ParsedPosition {
  coin: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  unrealizedPnl: number;
  marginUsed: number;
  side: "LONG" | "SHORT";
}

// Fetch positions for all vaults from Hyperliquid
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaults = searchParams.get("vaults");

  if (!vaults) {
    return NextResponse.json({ error: "Missing vault addresses" }, { status: 400 });
  }

  const vaultAddresses = vaults.split(",");

  try {
    // First, fetch current market prices
    const metaResponse = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    });

    const metaData = await metaResponse.json();
    const priceMap: Record<string, number> = {};
    
    // Build a map of coin -> current mark price
    if (metaData.universe && Array.isArray(metaData.universe)) {
      metaData.universe.forEach((asset: unknown) => {
        const assetData = asset as { name?: string };
        if (assetData.name) {
          priceMap[assetData.name] = 0; // Will be filled from allMids
        }
      });
    }

    // Fetch all current mark prices
    const allMidsResponse = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
    });

    const allMids = await allMidsResponse.json();
    if (metaData.universe && Array.isArray(metaData.universe)) {
      metaData.universe.forEach((asset: unknown, idx: number) => {
        const assetData = asset as { name?: string };
        if (assetData.name && allMids[idx]) {
          priceMap[assetData.name] = parseFloat(allMids[idx]);
        }
      });
    }

    // Fetch positions for all vaults in parallel
    const promises = vaultAddresses.map(async (vaultAddress) => {
      try {
        // FIRST: Try HLP endpoint for HLP vaults
        let positions: ParsedPosition[] = [];
        
        // Try hlpDetails first (for HLP)
        const hlpResponse = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "hlpDetails",
            user: vaultAddress.trim(),
          }),
        });

        if (hlpResponse.ok) {
          const hlpData: HLPData = await hlpResponse.json();
          
          // Check if this is HLP data (has openPositions array)
          if (hlpData && Array.isArray(hlpData.openPositions)) {
            console.log(`HLP vault detected: ${vaultAddress}`);
            
            // Parse HLP positions
            positions = hlpData.openPositions.map((pos: HLPPosition) => {
              const coin = pos.coin;
              const rawSize = parseFloat(pos.szi || "0");
              const size = Math.abs(rawSize);
              const entryPrice = parseFloat(pos.entryPx || "0");
              const unrealizedPnl = parseFloat(pos.unrealizedPnl || "0");
              
              // Get mark price
              let markPrice = priceMap[coin];
              if (!markPrice && size !== 0 && entryPrice > 0) {
                markPrice = (unrealizedPnl / size) + entryPrice;
              }
              if (!markPrice) {
                markPrice = entryPrice;
              }
              
              // Get leverage from HLP data
              const leverageValue = pos.leverage?.value ? parseFloat(pos.leverage.value) : 0;
              
              return {
                coin,
                size,
                entryPrice,
                markPrice,
                leverage: leverageValue,
                unrealizedPnl,
                marginUsed: parseFloat(pos.marginUsed || "0"),
                side: rawSize > 0 ? "LONG" : "SHORT"
              } as ParsedPosition;
            });
            
            console.log(`HLP vault ${vaultAddress}: Found ${positions.length} positions`);
            return { vaultAddress, positions };
          }
        }
        
        // If not HLP, try regular endpoint
        const response = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "clearinghouseState",
            user: vaultAddress.trim(),
          }),
        });

        if (!response.ok) {
          console.error(`Failed to fetch positions for ${vaultAddress}`);
          return { vaultAddress, positions: [] };
        }

        const data = await response.json();
        positions = (data.assetPositions || []).map((pos: RegularPosition) => {
          const coin = pos.position.coin;
          const entryPx = parseFloat(pos.position.entryPx || "0");
          const size = parseFloat(pos.position.szi);
          const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || "0");
          
          // Calculate mark price from unrealized PNL if available
          let markPrice = priceMap[coin];
          if (!markPrice && size !== 0 && entryPx > 0) {
            markPrice = (unrealizedPnl / size) + entryPx;
          }
          if (!markPrice) {
            markPrice = entryPx;
          }
          
          return {
            coin,
            size,
            entryPrice: entryPx,
            markPrice,
            leverage: parseFloat(pos.position.leverage?.value || "0"),
            unrealizedPnl,
            marginUsed: parseFloat(pos.position.marginUsed || "0"),
            side: size > 0 ? "LONG" : "SHORT"
          } as ParsedPosition;
        });

        console.log(`Regular vault ${vaultAddress}: Found ${positions.length} positions`);
        return { vaultAddress, positions };
      } catch (err) {
        console.error(`Error fetching positions for ${vaultAddress}:`, err);
        return { vaultAddress, positions: [] };
      }
    });

    const results = await Promise.all(promises);
    const positionsMap: Record<string, ParsedPosition[]> = {};
    
    results.forEach((result) => {
      positionsMap[result.vaultAddress] = result.positions;
    });

    return NextResponse.json(positionsMap, {
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}