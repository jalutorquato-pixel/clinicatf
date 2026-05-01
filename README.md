# Clínica TF - Sistema Local de Embaixadoras

Sistema offline/local para gerenciar clientes, embaixadoras por indicação, ciclos trimestrais, pontuação, benefícios, créditos, procedimentos, contratos e relatórios.

## Stack

- Backend: Python, FastAPI, SQLAlchemy e SQLite.
- Frontend: React, Vite, Axios, Recharts e Lucide Icons.
- Banco local: `backend/data/clinica.db`.

## Como rodar o backend

```powershell
cd "F:\Clinica TF\backend"
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

A API ficará em:

```text
http://127.0.0.1:8000
```

Documentação automática:

```text
http://127.0.0.1:8000/docs
```

## Como rodar o frontend

Em outro terminal:

```powershell
cd "F:\Clinica TF\frontend"
npm install
npm run dev
```

O app ficará em:

```text
http://localhost:5173
```

## Login padrão

```text
Usuário: admin
Senha: admin123
```

Troque essa senha antes de usar com dados reais.

## Dados iniciais

O script `backend/seed.py` cria:

- admin padrão;
- configurações iniciais da clínica;
- valor padrão de crédito pós-20 pontos: R$ 50;
- benefícios de 3 a 20 pontos;
- procedimentos de exemplo;
- ciclo ativo inicial de 90 dias;
- uma cliente/embaixadora de demonstração;
- modelo de contrato padrão.

## Fluxo principal

1. Cadastre clientes.
2. Transforme uma cliente em embaixadora.
3. Registre indicações manualmente ou pelo cupom/link.
4. Registre um procedimento para a indicada.
5. Valide o ponto da indicação.
6. Acompanhe ranking, benefícios conquistados, créditos e relatórios.

## Backup

Na tela de Configurações, use `Backup SQLite`. O backend copia o banco para:

```text
backend/backups/
```

## Observações técnicas

- Este primeiro corte usa criação direta de tabelas com SQLAlchemy e `seed.py`, sem Alembic.
- Clientes são inativados por padrão em vez de apagados fisicamente.
- Contratos são gerados com substituição simples de variáveis e exportação PDF textual.
- A organização em routers, models, schemas e services prepara o projeto para futura migração online.
