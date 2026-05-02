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

function parseClientId(params) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function clientPayload(data) {
  return {
    full_name: data.full_name,
    phone: data.phone,
    email: data.email,
    cpf: data.cpf,
    birth_date: data.birth_date ? new Date(data.birth_date) : null,
    address: data.address,
    zip_code: data.zip_code,
    street: data.street,
    address_number: data.address_number,
    address_complement: data.address_complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    origin: data.origin,
    notes: data.notes,
    is_active: data.is_active
  };
}

export async function GET(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseClientId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const client = await prisma.client.findFirst({
      where: { id, is_active: true }
    });

    if (!client) {
      return NextResponse.json({ detail: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseClientId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const existingClient = await prisma.client.findFirst({
      where: { id, is_active: true }
    });

    if (!existingClient) {
      return NextResponse.json({ detail: "Cliente não encontrado" }, { status: 404 });
    }

    const data = await req.json();
    const updatedClient = await prisma.client.update({
      where: { id },
      data: clientPayload(data)
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  const id = parseClientId(params);
  if (!id) return NextResponse.json({ detail: "ID inválido" }, { status: 400 });

  try {
    const existingClient = await prisma.client.findFirst({
      where: { id, is_active: true }
    });

    if (!existingClient) {
      return NextResponse.json({ detail: "Cliente não encontrado" }, { status: 404 });
    }

    await prisma.client.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
