-- ============================================
-- Schema 适配脚本：将旧库结构转换为新库结构
-- 目标：兼容 Prisma schema
-- ============================================

-- 1. 创建枚举类型
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'purchaser', 'producer', 'reviewer', 'salesperson', 'readonly');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
        CREATE TYPE quotation_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_type') THEN
        CREATE TYPE shipping_type AS ENUM ('fcl20', 'fcl40', 'lcl', 'air');
    END IF;
END $$;

-- 2. users 表适配
-- 添加新字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';

-- 迁移数据
UPDATE users SET name = real_name WHERE name IS NULL;
UPDATE users SET status = CASE WHEN is_active = true THEN 'active'::user_status ELSE 'inactive'::user_status END;

-- 删除旧字段
ALTER TABLE users DROP COLUMN IF EXISTS real_name;
ALTER TABLE users DROP COLUMN IF EXISTS is_active;

-- 3. 将 id 从 int4 改为 UUID (使用确定性 UUID v5)
-- 创建新列
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid_id UUID;

-- 生成确定性 UUID (使用用户名作为命名空间)
UPDATE users SET uuid_id = uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,  -- DNS namespace
    'users:' || id::text
) WHERE uuid_id IS NULL;

-- 添加唯一约束
ALTER TABLE users ADD CONSTRAINT users_uuid_unique UNIQUE (uuid_id);

-- 注意：外键引用 users.id 的其他表也需要相应修改
-- 这是一项大工程，建议运行完整的迁移脚本

-- 4. 检查其他表是否需要适配
-- 这里列出需要检查的关键字段

-- quotations 表字段检查
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS shipping_type shipping_type DEFAULT 'fcl20';

-- 根据 shipping_method 映射 shipping_type
UPDATE quotations SET shipping_type =
    CASE shipping_method
        WHEN 'fcl20' THEN 'fcl20'::shipping_type
        WHEN 'fcl40' THEN 'fcl40'::shipping_type
        WHEN 'lcl' THEN 'lcl'::shipping_type
        WHEN 'air' THEN 'air'::shipping_type
        ELSE 'fcl20'::shipping_type
    END
WHERE shipping_type IS NULL;

-- 5. 验证结果
SELECT 'Schema 适配完成' as status;
SELECT 'users 表记录数: ' || COUNT(*)::text as info FROM users;
SELECT 'name 字段非空: ' || COUNT(*)::text as info FROM users WHERE name IS NOT NULL;
SELECT 'status 字段已填充: ' || COUNT(*)::text as info FROM users WHERE status IS NOT NULL;
