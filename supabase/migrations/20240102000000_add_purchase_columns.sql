alter table public.subscriptions
  add column if not exists purchase_token text,
  add column if not exists sku text;
