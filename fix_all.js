const fs = require('fs');
const path = require('path');

// 1. CREATE APIS
const apiRoutes = [
  { path: 'sales', model: 'sale', include: 'client: { select: { full_name: true } }' },
  { path: 'contracts', model: 'contract', include: 'client: { select: { full_name: true } }, template: { select: { name: true } }' },
  { path: 'contract-templates', model: 'contractTemplate' },
  { path: 'account-entries', model: 'accountEntry' },
  { path: 'referrals', model: 'referral', include: 'ambassador: { select: { name: true } }, referred_client: { select: { full_name: true } }' },
  { path: 'products', model: 'product' },
  { path: 'stock-movements', model: 'stockMovement', include: 'product: { select: { name: true } }' },
  { path: 'anamnesis-records', model: 'anamnesisRecord', include: 'client: { select: { full_name: true } }' },
  { path: 'prescription-records', model: 'prescriptionRecord', include: 'client: { select: { full_name: true } }' },
  { path: 'professionals', model: 'professional' },
  { path: 'anamnesis-templates', model: 'anamnesisTemplate' },
  { path: 'prescription-templates', model: 'prescriptionTemplate' },
  { path: 'settings', model: 'setting' },
  { path: 'procedure-records', model: 'procedureRecord', include: 'client: { select: { full_name: true } }, procedure: { select: { name: true } }' },
  { path: 'appointments', model: 'appointment', include: 'client: { select: { full_name: true } }, procedure: { select: { name: true } }' }
];

const template = (model, include) => `import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'supersecret';

export const dynamic = 'force-dynamic';

async function getUser(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try { return jwt.verify(token, SECRET_KEY); } catch (e) { return null; }
}

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ detail: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    
    let where = {};
    if (clientId) {
      where.client_id = parseInt(clientId);
    }

    const records = await prisma.${model}.findMany({
      where,
      ${include ? `include: { ${include} },` : ''}
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
`;

apiRoutes.forEach(r => {
  const dir = path.join(__dirname, 'src/app/api', r.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'route.js'), template(r.model, r.include));
});

// Create /clients/[id]
const clientDir = path.join(__dirname, 'src/app/api/clients/[id]');
fs.mkdirSync(clientDir, { recursive: true });
fs.writeFileSync(path.join(clientDir, 'route.js'), `
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
`);

console.log("APIs created.");

// 2. REMOVE MOCKS
function removeCatchBlocks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  const catchRegex = /\.catch\s*\(\s*\(\)\s*=>/g;
  
  while(true) {
    catchRegex.lastIndex = 0; // reset
    const match = catchRegex.exec(content);
    if (!match) break;
    
    const idx = match.index;
    let openCount = 0;
    let foundOpen = false;
    let endIndex = -1;
    
    for(let i = idx; i < content.length; i++) {
      if (content[i] === '(') {
        openCount++;
        foundOpen = true;
      } else if (content[i] === ')') {
        openCount--;
      }
      
      if (foundOpen && openCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      content = content.substring(0, idx) + content.substring(endIndex + 1);
      modified = true;
    } else {
      break; // fail safe
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Cleaned mock data in:", filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      removeCatchBlocks(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src/app/(dashboard)'));
console.log("Mocks removed.");
