// app/api/debug-hlp/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaultAddress = searchParams.get("vault") || "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303";

  try {
    console.log(`\n=== DEBUG: Testing vault ${vaultAddress} ===\n`);
    
    // Test hlpDetails
    const hlpRes = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "hlpDetails",
        user: vaultAddress,
      }),
    });
    
    const hlpData = await hlpRes.json();
    
    // Test clearinghouseState  
    const regularRes = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: vaultAddress,
      }),
    });
    
    const regularData = await regularRes.json();

    return NextResponse.json({
      vaultAddress,
      hlpDetails: {
        status: hlpRes.status,
        ok: hlpRes.ok,
        data: hlpData,
        hasOpenPositions: Array.isArray(hlpData.openPositions),
        openPositionsCount: Array.isArray(hlpData.openPositions) ? hlpData.openPositions.length : 0
      },
      clearinghouseState: {
        status: regularRes.status,
        ok: regularRes.ok,
        data: regularData,
        hasAssetPositions: Array.isArray(regularData.assetPositions),
        assetPositionsCount: Array.isArray(regularData.assetPositions) ? regularData.assetPositions.length : 0
      }
    });

  } catch (error) {
    console.error("Debug failed:", error);
    return NextResponse.json(
      { error: "Debug failed", details: String(error) },
      { status: 500 }
    );
  }
}