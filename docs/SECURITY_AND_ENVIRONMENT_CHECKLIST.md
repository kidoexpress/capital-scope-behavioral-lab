# Security & Environment Checklist

Data: **2026-07-24** · Repositório: **capital-scope-behavioral-lab**

## 1. Segredos

| Item | Status |
|---|---|
| `.env.local` copiado do original? | ❌ **Não** — clone Git não copia arquivos não rastreados/ignorados |
| Arquivos `.env` rastreados no Git? | Apenas `.env.example` (somente placeholders) |
| Valores de segredos impressos em terminal/relatórios? | ❌ Nunca |
| Segredos no histórico do Git? | Nenhum detectado — apenas `.env.example` é rastreado |
| `.gitignore` protege `.env` / `.env.*`? | ✅ Sim (exceção explícita para `.env.example`) |

`.env.local` do original permanece **somente** no repositório original, intocado.

## 2. Isolamento

| Recurso | Como foi isolado |
|---|---|
| **Banco de dados** | SQLite file-based (`paper_trading/paper_trading.db`) vive sob o diretório desta cópia e é gitignored → nunca toca dados do upstream |
| **Portas de dev** | Vite `5173→5273`, FastAPI `8000→8100` (roda ao lado do original) |
| **CORS** | `main.py` e `paper_trading/api.py` atualizados para as portas do Lab |
| **localStorage** | chave de persistência do Zustand renomeada para `capital-scope-behavioral-lab-portfolio` |
| **Ambiente** | `.env.example` reescrito; `.env.local` deve ser criado localmente |

## 3. Serviços externos que precisam de **novas credenciais** (recomendação)

Estes usam credenciais/URLs herdadas do upstream. Para operar de forma
independente, gere/atualize:

- **Anthropic API key** (`VITE_ANTHROPIC_API_KEY`) — chave própria do Lab.
- **Financial Modeling Prep** (`VITE_FMP_API_KEY`) — opcional.
- **Finnhub** (`VITE_FINNHUB_API_KEY`) — opcional.
- **GitHub remote** — o novo `origin` deve apontar para o repo privado
  `capital-scope-behavioral-lab` (criado pelo usuário).
- **URLs no rodapé** (`src/components/ui/hover-footer.tsx`): links do GitHub e
  `mailto:contact@capitalscope.io` ainda apontam para o upstream — **preservados
  intencionalmente** como referência; atualizar quando o Lab tiver seu próprio
  domínio/contato.

## 4. Referências técnicas preservadas de propósito

- Símbolo de componente React `CapitalScopeFooter` (renomear exigiria alterar
  imports; só o texto exibido foi trocado).
- Remote `capital-scope-upstream` → aponta para o repositório original apenas para
  cherry-picks futuros. **Nenhum merge automático.**

## 5. Confirmações

- ✅ Nenhuma alteração foi feita no repositório original.
- ✅ Todas as mudanças ocorreram em `capital-scope-behavioral-lab`.
- ✅ Nenhum segredo foi copiado para arquivos rastreados.
- ✅ Nenhuma chamada real de LLM foi adicionada.
- ✅ Nenhuma operação real de investimento foi adicionada.

## 6. Se um segredo for encontrado no histórico

Não reescrever o histórico automaticamente. Registrar o achado e **recomendar a
rotação da credencial** afetada. (Nenhum segredo rastreado foi encontrado nesta
duplicação.)
