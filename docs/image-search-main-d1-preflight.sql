-- 图片搜索开工前：主测试 D1 只读核对脚本
-- 本文件不创建、修改或删除任何对象，可直接对主测试库执行。

-- 1. 核对当前图片及相册表结构；确认 search_aliases 是否已经存在。
PRAGMA table_info('img_info');
PRAGMA table_info('img_series');
PRAGMA table_info('img_series_i18n');
PRAGMA table_info('img_series_items');

-- 2. M/B/S 图片数量、上传状态以及 comment 覆盖率。
SELECT
    img_type,
    uploading,
    COUNT(*) AS image_count,
    SUM(CASE WHEN trim(COALESCE(comment, '')) <> '' THEN 1 ELSE 0 END) AS with_comment
FROM img_info
WHERE img_type IN ('M', 'B', 'S')
GROUP BY img_type, uploading
ORDER BY img_type, uploading;

-- 3. 公开端第一期可搜索范围：已上传完成、属于至少一个公开相册的 M 图片。
SELECT COUNT(*) AS public_m_image_count
FROM img_info AS image
WHERE image.img_type = 'M'
  AND image.uploading = 0
  AND EXISTS (
      SELECT 1
      FROM img_series_items AS item
      JOIN img_series AS series
        ON series.series_id = item.series_id
      WHERE item.img_id = image.id
        AND series.is_public = 1
  );

-- 4. 已上传完成但不属于公开相册的 M 图片；它们只能由管理端搜索。
SELECT COUNT(*) AS non_public_m_image_count
FROM img_info AS image
WHERE image.img_type = 'M'
  AND image.uploading = 0
  AND NOT EXISTS (
      SELECT 1
      FROM img_series_items AS item
      JOIN img_series AS series
        ON series.series_id = item.series_id
      WHERE item.img_id = image.id
        AND series.is_public = 1
  );

-- 5. 验证“B/S 没有相册”的当前数据假设；预期返回 0 行。
SELECT image.img_type, COUNT(DISTINCT image.id) AS attached_image_count
FROM img_info AS image
JOIN img_series_items AS item
  ON item.img_id = image.id
WHERE image.img_type IN ('B', 'S')
GROUP BY image.img_type;

-- 6. 检查相册条目是否存在重复图片关系；返回结果需要在构建 album_text 时去重。
SELECT series_id, img_id, COUNT(*) AS duplicate_count
FROM img_series_items
GROUP BY series_id, img_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, series_id, img_id
LIMIT 100;

-- 7. 核对数字 ID 与旧版 img_info_* ID 的可逆映射。
SELECT
    id,
    'img_info_' || id AS img_id,
    CAST(substr('img_info_' || id, 10) AS INTEGER) AS round_trip_id,
    img_type,
    uploading,
    fname,
    comment
FROM img_info
WHERE img_type IN ('M', 'B', 'S')
ORDER BY id DESC
LIMIT 20;

-- 8. 抽样查看公开 M 图片及其全部公开相册多语言文本。
-- 同一图片可属于多个相册，正式索引构建时应聚合并去重这些 title/description。
SELECT
    image.id AS image_id,
    image.comment,
    GROUP_CONCAT(DISTINCT i18n.lang || ':' || i18n.title || ' ' || i18n.description) AS public_album_text
FROM img_info AS image
JOIN img_series_items AS item
  ON item.img_id = image.id
JOIN img_series AS series
  ON series.series_id = item.series_id
 AND series.is_public = 1
LEFT JOIN img_series_i18n AS i18n
  ON i18n.series_id = series.series_id
WHERE image.img_type = 'M'
  AND image.uploading = 0
GROUP BY image.id, image.comment
ORDER BY image.id DESC
LIMIT 20;

-- 9. 找出异常类型或异常 uploading 值，避免全量重建时静默漏数。
SELECT img_type, uploading, COUNT(*) AS image_count
FROM img_info
WHERE img_type NOT IN ('M', 'B', 'S')
   OR uploading NOT IN (0, 1)
GROUP BY img_type, uploading
ORDER BY img_type, uploading;
