# Comissão por vendedor

- Todo vendedor possui `customCommissionRate`, padrão de 5%.
- Apenas ADMIN pode alterar a taxa pelo painel de Gestão de Usuários.
- A taxa aceita valores de 0% a 100%, inclusive casas decimais.
- O cálculo usa a taxa salva no vendedor no momento da confirmação do pagamento.
- Produtos com origem `OWN` continuam sem comissão, conforme a regra existente do projeto.
- Para aplicar a alteração no banco, execute `npm run migrate` (ou `npx prisma db push`).
