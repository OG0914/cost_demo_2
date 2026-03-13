-- ============================================
-- 完整 Schema 适配脚本
-- 将旧库结构转换为 Prisma 兼容结构
-- ============================================

-- 1. 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建枚举类型
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
        CREATE TYPE shipping_type AS ENUM ('fcl20', 'fcl40', 'lcl');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_type') THEN
        CREATE TYPE sale_type AS ENUM ('domestic', 'export');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency') THEN
        CREATE TYPE currency AS ENUM ('CNY', 'USD');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'process_unit') THEN
        CREATE TYPE process_unit AS ENUM ('piece', 'dozen');
    END IF;
END $$;

-- 3. users 表适配 - 添加新字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid_id UUID;

-- 4. 迁移数据
UPDATE users SET name = real_name WHERE name IS NULL;
UPDATE users SET status = CASE WHEN is_active = true THEN 'active'::user_status ELSE 'inactive'::user_status END;

-- 5. 生成确定性 UUID
UPDATE users SET uuid_id = uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    'users:' || id::text
) WHERE uuid_id IS NULL;

-- 6. 创建新表结构（符合 Prisma schema）
-- 6.1 创建新 users 表
CREATE TABLE IF NOT EXISTS users_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role user_role DEFAULT 'readonly',
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6.2 迁移数据到新表
INSERT INTO users_new (id, username, password, name, email, role, status, created_at, updated_at)
SELECT
    uuid_id,
    username,
    password,
    name,
    COALESCE(email, username || '@example.com'),
    CASE
        WHEN role = 'admin' THEN 'admin'::user_role
        WHEN role = 'purchaser' THEN 'purchaser'::user_role
        WHEN role = 'producer' THEN 'producer'::user_role
        WHEN role = 'reviewer' THEN 'reviewer'::user_role
        WHEN role = 'salesperson' THEN 'salesperson'::user_role
        ELSE 'readonly'::user_role
    END,
    status,
    created_at,
    updated_at
FROM users
ON CONFLICT (username) DO NOTHING;

-- 7. 创建 ID 映射表（用于外键转换）
CREATE TABLE IF NOT EXISTS id_mapping AS
SELECT
    id as old_id,
    uuid_id as new_id,
    username
FROM users;

-- 8. 查看迁移结果
SELECT 'users 表迁移完成' as status;
SELECT '旧表记录数: ' || COUNT(*)::text FROM users;
SELECT '新表记录数: ' || COUNT(*)::text FROM users_new;

-- 注意：其他表（customers, quotations等）也需要类似的转换
-- 这是完整的 schema 迁移，需要更多步骤处理所有外键关系
