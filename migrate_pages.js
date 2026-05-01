const fs = require('fs');
const path = require('path');

const srcPagesDir = path.join(__dirname, '../frontend/src/pages');
const targetAppDir = path.join(__dirname, 'src/app/(dashboard)');

// Cria diretório dashboard se não existir
if (!fs.existsSync(targetAppDir)) {
  fs.mkdirSync(targetAppDir, { recursive: true });
}

const files = fs.readdirSync(srcPagesDir);

files.forEach(file => {
  if (file.endsWith('.jsx') && file !== 'Login.jsx' && file !== 'Pages.jsx') {
    const pageName = file.replace('.jsx', '').toLowerCase();
    const targetDir = path.join(targetAppDir, pageName);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let content = fs.readFileSync(path.join(srcPagesDir, file), 'utf8');

    // Adaptações React Router para Next.js App Router
    content = content.replace(/import\s+{.*useNavigate.*}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";');
    content = content.replace(/import\s+{.*Link.*}\s+from\s+['"]react-router-dom['"];?/g, 'import Link from "next/link";');
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, 'const router = useRouter();');
    content = content.replace(/navigate\(/g, 'router.push(');
    content = content.replace(/import\s+apiClient.*from\s+['"]..\/api\/client['"]/g, 'import apiClient from "@/api/client"');
    content = content.replace(/..\/api\/client/g, '../../../api/client');
    content = content.replace(/..\/components/g, '../../../components');
    
    // Add "use client" if it uses state or router
    if (content.includes('useState') || content.includes('useEffect') || content.includes('useRouter')) {
      content = '"use client";\n\n' + content;
    }

    fs.writeFileSync(path.join(targetDir, 'page.jsx'), content);
    console.log(`Migrated ${file} to src/app/(dashboard)/${pageName}/page.jsx`);
  }
});
