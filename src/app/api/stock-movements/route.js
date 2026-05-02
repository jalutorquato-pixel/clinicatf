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
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true
      },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(movements);
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const data = await req.json();
    
    // Create stock movement
    const newMovement = await prisma.stockMovement.create({
      data: {
        product_id: data.product_id,
        type: data.type || 'entrada',
        quantity: data.quantity || 0,
        reason: data.reason,
        notes: data.notes
      },
      include: {
        product: true
      }
    });

    // Update product stock
    if (data.type === 'entrada') {
      await prisma.product.update({
        where: { id: data.product_id },
        data: {
          stock_quantity: {
            increment: data.quantity
          }
        }
      });
    } else if (data.type === 'saida') {
      await prisma.product.update({
        where: { id: data.product_id },
        data: {
          stock_quantity: {
            decrement: data.quantity
          }
        }
      });
    }

    return NextResponse.json(newMovement);
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

    const movement = await prisma.stockMovement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!movement) {
      return NextResponse.json({ detail: "Movimento não encontrado" }, { status: 404 });
    }

    // Reverse the stock movement
    if (movement.type === 'entrada') {
      await prisma.product.update({
        where: { id: movement.product_id },
        data: {
          stock_quantity: {
            decrement: movement.quantity
          }
        }
      });
    } else if (movement.type === 'saida') {
      await prisma.product.update({
        where: { id: movement.product_id },
        data: {
          stock_quantity: {
            increment: movement.quantity
          }
        }
      });
    }

    await prisma.stockMovement.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Movimento de estoque deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
