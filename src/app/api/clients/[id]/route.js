
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  try {
    const record = await prisma.client.findUnique({ where: { id: parseInt(params.id) } });
    if (!record) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    return NextResponse.json(record);
  } catch(e) {
    return NextResponse.json({ detail: "Error" }, { status: 500 });
  }
}
