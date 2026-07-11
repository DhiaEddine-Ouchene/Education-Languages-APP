import { NextResponse } from "next/server";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json(
    Object.entries(PLANS).map(([key, p]) => ({ key, name: p.name, monthly: p.monthly, yearly: p.yearly, features: p.features }))
  );
}
