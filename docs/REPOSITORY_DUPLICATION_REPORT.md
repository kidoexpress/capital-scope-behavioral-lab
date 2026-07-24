# Repository Duplication Report

## Resumo

| Campo | Valor |
|---|---|
| Data da duplicação | **2026-07-24** |
| Produto | **Capital Scope Behavioral Lab** |
| Repositório de origem (upstream) | `git@github-kidoexpress:kidoexpress/CapitalScope-Terminal.git` |
| Caminho local do original | `/Users/karinekido/capitalscope-terminal` |
| Novo repositório (local) | `/Users/karinekido/capital-scope-behavioral-lab` |
| Novo repositório (GitHub) | privado `capital-scope-behavioral-lab` — **criado pelo usuário via github.com** |
| Commit-base | `6cac4183dc3fc8920dfb02ccc90e881af9247b12` (`6cac418`) |
| Método | `git clone` a partir do clone local (preserva histórico completo) |

## Remotes configurados

```
capital-scope-upstream  git@github-kidoexpress:kidoexpress/CapitalScope-Terminal.git  (fetch/push)
origin                  <a definir — repo privado criado pelo usuário>               (a adicionar)
```

- `capital-scope-upstream` aponta para o **repositório original**, apenas para
  cherry-picks futuros. **Nenhum merge automático.**
- `origin` será adicionado quando o usuário fornecer a URL do repo privado, seguido
  de `git push -u origin --all` e `git push origin --tags`.

## Branches copiadas

- `main` (espelha `capital-scope-upstream/main` @ `6cac418`)
- `backup-local-work` (preservada do original @ `12233e9`)
- `chore/initialize-behavioral-lab` (**nova** — trabalho desta etapa)

## Tags copiadas

- **Nenhuma** (o repositório original não possui tags).

## Trabalho local não commitado (incluído por decisão do usuário)

O working tree original tinha mudanças não commitadas. Por decisão explícita, foram
**incluídas** na cópia (via patch + cópia do arquivo novo), **sem alterar o original**:

- `paper_trading/market_data.py`, `paper_trading/proxy.py`
- `src/components/charts/PriceChart.tsx`, `src/components/layout/TopBar.tsx`
- `src/components/ui/StockSearch.tsx`, `src/services/marketDataService.ts`
- `src/utils/api.ts`
- `src/config/tickerAliases.ts` (novo, antes não rastreado)

Registradas no commit `chore: duplicate Capital Scope 2 into Behavioral Lab repository`.

Não incluído: o diretório não rastreado `.claude/` (config de ferramenta local).

## Arquivos excluídos por segurança

- `.env.local` — **não copiado** (clone Git ignora não rastreados; ele é gitignored).
- `node_modules/`, `dist/`, `paper_trading/*.db`, `portfolios_state.json` — não
  rastreados/ignorados, não entram no clone.

## Serviços que precisam de novas credenciais

Ver [`SECURITY_AND_ENVIRONMENT_CHECKLIST.md`](SECURITY_AND_ENVIRONMENT_CHECKLIST.md)
§3: Anthropic, FMP, Finnhub, novo `origin` GitHub, e URLs de rodapé.

## Commits desta etapa (branch `chore/initialize-behavioral-lab`)

1. `chore: duplicate Capital Scope 2 into Behavioral Lab repository`
2. `chore: isolate environment and external services`
3. `chore: rename application to Capital Scope Behavioral Lab`
4. `docs: add Behavioral Lab product and research specifications`
5. `feat: scaffold Behavioral Lab module`
6. `test: add initial module and configuration checks`

## Confirmação

- ✅ **Nenhuma alteração foi feita no repositório original.**
- ✅ **Todas as mudanças foram realizadas no novo repositório capital-scope-behavioral-lab.**
- ✅ Histórico Git preservado; branches e tags (nenhuma) copiadas.
- ✅ `origin` (a configurar) apontará para o Behavioral Lab; `capital-scope-upstream`
  aponta para o original.
