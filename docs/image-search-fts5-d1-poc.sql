-- 图片搜索 FTS5 / trigram D1 远端测试脚本
-- 建议仅在专用测试库执行。对象统一使用 image_search_poc_ 前缀。

DROP TRIGGER IF EXISTS image_search_poc_document_ai;
DROP TRIGGER IF EXISTS image_search_poc_document_ad;
DROP TRIGGER IF EXISTS image_search_poc_document_au;
DROP TABLE IF EXISTS image_search_poc_fts;
DROP TABLE IF EXISTS image_search_poc_document;

CREATE TABLE image_search_poc_document (
    image_id INTEGER PRIMARY KEY,
    img_type TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    alias_text TEXT NOT NULL DEFAULT '',
    album_text TEXT NOT NULL DEFAULT '',
    comment_text TEXT NOT NULL DEFAULT '',
    content_hash TEXT NOT NULL DEFAULT '',
    indexed_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX image_search_poc_document_scope_idx
ON image_search_poc_document(img_type, is_public, image_id);

CREATE VIRTUAL TABLE image_search_poc_fts USING fts5(
    alias_text,
    album_text,
    comment_text,
    content = 'image_search_poc_document',
    content_rowid = 'image_id',
    tokenize = 'trigram'
);

CREATE TRIGGER image_search_poc_document_ai
AFTER INSERT ON image_search_poc_document
BEGIN
    INSERT INTO image_search_poc_fts(
        rowid,
        alias_text,
        album_text,
        comment_text
    ) VALUES (
        new.image_id,
        new.alias_text,
        new.album_text,
        new.comment_text
    );
END;

CREATE TRIGGER image_search_poc_document_ad
AFTER DELETE ON image_search_poc_document
BEGIN
    INSERT INTO image_search_poc_fts(
        image_search_poc_fts,
        rowid,
        alias_text,
        album_text,
        comment_text
    ) VALUES (
        'delete',
        old.image_id,
        old.alias_text,
        old.album_text,
        old.comment_text
    );
END;

CREATE TRIGGER image_search_poc_document_au
AFTER UPDATE ON image_search_poc_document
WHEN old.alias_text IS NOT new.alias_text
  OR old.album_text IS NOT new.album_text
  OR old.comment_text IS NOT new.comment_text
BEGIN
    INSERT INTO image_search_poc_fts(
        image_search_poc_fts,
        rowid,
        alias_text,
        album_text,
        comment_text
    ) VALUES (
        'delete',
        old.image_id,
        old.alias_text,
        old.album_text,
        old.comment_text
    );

    INSERT INTO image_search_poc_fts(
        rowid,
        alias_text,
        album_text,
        comment_text
    ) VALUES (
        new.image_id,
        new.alias_text,
        new.album_text,
        new.comment_text
    );
END;

-- 101：alias 命中；102：相册命中；103：comment 命中。
-- 104：非公开 M 图片，只应被管理端查询命中。
-- 201/301：B/S 图片，没有相册，但可以维护 comment 和 alias。
INSERT INTO image_search_poc_document(
    image_id,
    img_type,
    is_public,
    alias_text,
    album_text,
    comment_text,
    content_hash
) VALUES
    (101, 'M', 1, '日本武道館 日本武道馆 武道館 武道馆 ぶどうかん ブドウカン budokan', '通常ライブ', 'ライブ 2024-03-15', 'poc-101'),
    (102, 'M', 1, '', 'milet 5th anniversary live GREEN LIGHTS 日本武道館公演', 'ライブ 2024-03-16', 'poc-102'),
    (103, 'M', 1, '', '通常ライブ', '日本武道館 ライブ 2024-03-17', 'poc-103'),
    (104, 'M', 0, '武道館 private rehearsal', '', '非公開リハーサル', 'poc-104'),
    (201, 'B', 0, 'インタビュー interview 访谈 訪談', '', '雑誌インタビュー 2025', 'poc-201'),
    (301, 'S', 0, '東京タワー 东京塔 とうきょうタワー', '', '東京タワー周辺の巡礼写真', 'poc-301');

-- 1. 确认表、虚拟表和 FTS5 shadow tables 已创建。
PRAGMA table_list;

-- 2. 公开端查询：只能返回公开 M 图片。
-- 预期包含 101、102、103，不包含 104、201、301。
SELECT
    f.rowid AS image_id,
    d.img_type,
    d.is_public,
    bm25(image_search_poc_fts, 12.0, 4.0, 1.0) AS search_rank
FROM image_search_poc_fts AS f
JOIN image_search_poc_document AS d
  ON d.image_id = f.rowid
WHERE image_search_poc_fts MATCH '"武道館"'
  AND d.img_type = 'M'
  AND d.is_public = 1
ORDER BY search_rank ASC, image_id DESC;

-- 3. 管理端不限公开状态：预期额外包含 104。
SELECT
    f.rowid AS image_id,
    d.img_type,
    d.is_public,
    bm25(image_search_poc_fts, 12.0, 4.0, 1.0) AS search_rank
FROM image_search_poc_fts AS f
JOIN image_search_poc_document AS d
  ON d.image_id = f.rowid
WHERE image_search_poc_fts MATCH '"武道館"'
ORDER BY search_rank ASC, image_id DESC;

-- 4. 管理端 B 类型查询：验证英文和日文 alias。
SELECT f.rowid AS image_id, d.img_type
FROM image_search_poc_fts AS f
JOIN image_search_poc_document AS d
  ON d.image_id = f.rowid
WHERE image_search_poc_fts MATCH '"interview"'
  AND d.img_type = 'B';

SELECT f.rowid AS image_id, d.img_type
FROM image_search_poc_fts AS f
JOIN image_search_poc_document AS d
  ON d.image_id = f.rowid
WHERE image_search_poc_fts MATCH '"インタビュー"'
  AND d.img_type = 'B';

-- 5. 简繁体依赖显式 alias，分别验证。
SELECT rowid AS image_id
FROM image_search_poc_fts
WHERE image_search_poc_fts MATCH '"武道馆"';

SELECT rowid AS image_id
FROM image_search_poc_fts
WHERE image_search_poc_fts MATCH '"武道館"';

-- 6. trigram 不负责两个字符的查询；使用受限 instr() 补偿。
-- 预期命中 301。
SELECT image_id, img_type
FROM image_search_poc_document
WHERE img_type = 'S'
  AND (
      instr(alias_text, '東京') > 0
      OR instr(album_text, '東京') > 0
      OR instr(comment_text, '東京') > 0
  )
ORDER BY image_id DESC
LIMIT 24 OFFSET 0;

-- 7. 验证 UPDATE trigger：更新后应能检索 Arena。
UPDATE image_search_poc_document
SET alias_text = alias_text || ' Arena アリーナ'
WHERE image_id = 201;

SELECT rowid AS image_id
FROM image_search_poc_fts
WHERE image_search_poc_fts MATCH '"arena"';

-- 8. 验证 DELETE trigger：删除后不应再返回 301。
DELETE FROM image_search_poc_document WHERE image_id = 301;

SELECT rowid AS image_id
FROM image_search_poc_fts
WHERE image_search_poc_fts MATCH '"東京タワー"';

-- 9. 验证 external-content 重建及一致性检查。
INSERT INTO image_search_poc_fts(image_search_poc_fts) VALUES ('rebuild');
INSERT INTO image_search_poc_fts(image_search_poc_fts) VALUES ('integrity-check');

-- 10. 最终数量应一致。
SELECT
    (SELECT COUNT(*) FROM image_search_poc_document) AS document_count,
    (SELECT COUNT(*) FROM image_search_poc_fts) AS fts_count;

-- 11. 新表不使用 CHECK IN；由应用写入校验和健康检查兜底。
-- 正常样本预期 invalid_scope_count=0。
SELECT COUNT(*) AS invalid_scope_count
FROM image_search_poc_document
WHERE img_type NOT IN ('M', 'B', 'S')
   OR is_public NOT IN (0, 1);

-- 测试结束后如需清理，按以下顺序执行：
-- DROP TRIGGER IF EXISTS image_search_poc_document_ai;
-- DROP TRIGGER IF EXISTS image_search_poc_document_ad;
-- DROP TRIGGER IF EXISTS image_search_poc_document_au;
-- DROP TABLE IF EXISTS image_search_poc_fts;
-- DROP TABLE IF EXISTS image_search_poc_document;
