# Divide Aí — atualização completa

Base preservada: projeto existente + comissão individual por vendedor.

## Incluído nesta versão
- Home com UX de marketplace própria, busca visual, categorias, rails e benefícios.
- Carrossel de banners responsivo com desktop/mobile e gestão ADM.
- PWA: manifest, service worker e aviso discreto de instalação com fluxo iOS/Android.
- Sistema de temas modular em `frontend/public/themes/*/theme.json`.
- Tema Natal incluído.
- Página pública `/pedido/:protocol` com linha do tempo.
- Histórico de eventos de pedido.
- Avanço de status pelo vendedor/ADM.
- Checkout Pix com cópia, QR quando fornecido, contador e polling de confirmação.
- Notificações internas para cliente e vendedor.
- Avaliação bilateral após pedido concluído.
- Ranking público de vendedores.
- Comentários e moderação ADM.
- Dashboard financeiro/operacional ADM.
- Gestão de banners ADM.
- Gestão de cupons ADM e validação de cupom.
- Gestão de pedidos no painel do vendedor.
- Comissão individual existente preservada.

## Banco
Novos modelos: `OrderEvent`, `Notification`, `Comment`, `Coupon`, `Banner`.

Antes de publicar, execute:

```bash
npm run db:generate
npm run migrate
```

O script `migrate` agora usa `prisma db push` sem `--accept-data-loss`, evitando autorizar perda de dados automaticamente.

## Banners por tema
Arquivos podem ser organizados em:

```text
frontend/public/themes/default/banners/
frontend/public/themes/natal/banners/
```

O painel ADM também aceita URLs de banners desktop/mobile.

## Pix
A confirmação automática depende do webhook real da EFI e das credenciais configuradas no ambiente.
