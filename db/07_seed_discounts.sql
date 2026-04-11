BEGIN;

-- ==========================================
-- 10. ACTIVE DISCOUNTS (Admin Deals)
-- ==========================================
INSERT INTO public.discount (discount_end_date, discount_start_date, discount_type, discount_value, product_id) VALUES
('2026-12-31 23:59:59', NOW(), 'PERCENT', 15, 137), -- Coca Cola 15% reducere
('2026-12-31 23:59:59', NOW(), 'PERCENT', 20, 167), -- Milka Oreo 20% reducere
('2026-12-31 23:59:59', NOW(), 'PERCENT', 10, 189), -- Paste Penne 10% reducere
('2026-12-31 23:59:59', NOW(), 'PERCENT', 25, 252), -- Mere 25% reducere
('2026-12-31 23:59:59', NOW(), 'PERCENT', 30, 282); -- Piept de pui 30% reducere

SELECT setval(pg_get_serial_sequence('public.discount', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.discount;

COMMIT;