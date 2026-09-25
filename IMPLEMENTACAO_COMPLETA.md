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

## Atualização — Administração da vitrine e banners
- Aba **Meus Produtos** no ADM para criar, editar, destacar e excluir produtos próprios da plataforma.
- Produtos próprios usam `origin=OWN` e aparecem em **Assine com o Divide Aí**; anúncios dos vendedores continuam em **Ofertas da comunidade**.
- Aba **Configurações** com regras gerais da plataforma editáveis pelo ADM.
- Seletor de intervalo do carrossel entre 3 e 30 segundos.
- Banner agora possui etiqueta, título, descrição e texto de botão independentes por banner.
- Banners podem ser criados, editados, ativados/desativados, ordenados e excluídos.
- Logo do site: coloque o arquivo `logo.png` em `frontend/public/branding/`.
- Para imagens de banner versionadas no GitHub, podem ser usados caminhos como `/themes/default/banners/banner.webp`.

### Compatibilidade com PostgreSQL já existente no Railway
A aplicação executa um bootstrap não destrutivo no início para adicionar somente as novas colunas necessárias (`IF NOT EXISTS`). Nenhuma tabela é recriada e nenhum dado existente é apagado.
