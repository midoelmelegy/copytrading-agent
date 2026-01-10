// app/api/test-hlp/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaultAddress = searchParams.get("vault") || "0xdfc24b077bc1425ad1dea75bcb6f8158e10df303";

  try {
    console.log(`Testing HLP endpoints for vault: ${vaultAddress}`);
    
    // Test 1: Try regular clearinghouseState (should fail for HLP)
    console.log("\n=== Test 1: Regular clearinghouseState ===");
    try {
      const regularResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: vaultAddress.trim(),
        }),
      });

      const regularData = await regularResponse.json();
      console.log("Regular endpoint response:", JSON.stringify(regularData, null, 2));
      console.log("Regular endpoint has positions?", Array.isArray(regularData.assetPositions));
      console.log("Regular endpoint assetPositions length:", regularData.assetPositions?.length || 0);
    } catch (err) {
      console.log("Regular endpoint failed:", err);
    }

    // Test 2: Try hlpDetails (should work for HLP)
    console.log("\n=== Test 2: HLP Details ===");
    try {
      const hlpResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hlpDetails",
          user: vaultAddress.trim(),
        }),
      });

      const hlpData = await hlpResponse.json();
      console.log("HLP endpoint response keys:", Object.keys(hlpData));
      console.log("HLP endpoint has openPositions?", Array.isArray(hlpData.openPositions));
      console.log("HLP endpoint openPositions length:", hlpData.openPositions?.length || 0);
      console.log("HLP endpoint sample position:", hlpData.openPositions?.[0]);
      
      // Check for HLP-specific fields
      console.log("Has totalEquity?", hlpData.totalEquity !== undefined);
      console.log("Has hlpAssets?", hlpData.hlpAssets !== undefined);
      console.log("Has freeCollateral?", hlpData.freeCollateral !== undefined);
    } catch (err) {
      console.log("HLP endpoint failed:", err);
    }

    // Test 3: Try hlpHistory
    console.log("\n=== Test 3: HLP History ===");
    try {
      const historyResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hlpHistory",
          user: vaultAddress.trim(),
          startTime: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 // 7 days
        }),
      });

      const historyData = await historyResponse.json();
      console.log("HLP History is array?", Array.isArray(historyData));
      console.log("HLP History length:", Array.isArray(historyData) ? historyData.length : "Not an array");
      console.log("HLP History sample item:", Array.isArray(historyData) ? historyData[0] : historyData);
    } catch (err) {
      console.log("HLP History endpoint failed:", err);
    }

    // Test 4: Try vaultDetails
    console.log("\n=== Test 4: Vault Details ===");
    try {
      const vaultResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "vaultDetails",
          vaultAddress: vaultAddress.trim(),
        }),
      });

      const vaultData = await vaultResponse.json();
      console.log("Vault Details keys:", Object.keys(vaultData));
      console.log("Has portfolio?", vaultData.portfolio !== undefined);
      console.log("Has followers?", Array.isArray(vaultData.followers));
      console.log("Followers count:", vaultData.followers?.length || 0);
    } catch (err) {
      console.log("Vault Details endpoint failed:", err);
    }

    return NextResponse.json({ 
      message: "Test complete. Check server console for results.",
      vaultAddress 
    });

  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}