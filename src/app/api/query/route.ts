/**
 * /api/query — Named Query Execution Endpoint
 *
 * Receives { queryId, params }, resolves via the query registry,
 * and returns data. This separates "execute a named data query"
 * from the HR CRUD actions in /api/hr.
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveQuery, isQueryRegistered } from "@/services/query-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId, params } = body;

    if (!queryId || typeof queryId !== "string") {
      return NextResponse.json(
        { error: "queryId (string) is required" },
        { status: 400 }
      );
    }

    if (!isQueryRegistered(queryId)) {
      return NextResponse.json(
        { error: `Unknown queryId: "${queryId}"` },
        { status: 400 }
      );
    }

    console.log(`[Query API] Executing queryId="${queryId}"`, JSON.stringify(params ?? {}).substring(0, 200));

    const data = await resolveQuery(queryId, params ?? {});

    return NextResponse.json({
      data,
      queryId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Query API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Query execution failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
