import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (e) {
    return null;
  }
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
      include: {
        stock_movements: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        sku: data.sku,
        description: data.description,
        price: data.price || 0,
        cost: data.cost || 0,
        stock_quantity: data.stock_quantity || 0,
        min_stock: data.min_stock || 0,
        is_active: data.is_active ?? true
      },
      include: {
        stock_movements: true
      }
    });
    return NextResponse.json(newProduct);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ detail: "ID é requerido" }, { status: 400 });

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        category: data.category,
        sku: data.sku,
        description: data.description,
        price: data.price,
        cost: data.cost,
        stock_quantity: data.stock_quantity,
        min_stock: data.min_stock,
        is_active: data.is_active
      },
      include: {
        stock_movements: true
      }
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ detail: "ID é requerido" }, { status: 400 });

    // Soft delete - apenas marca como inativo
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { is_active: false }
    });
    return NextResponse.json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
