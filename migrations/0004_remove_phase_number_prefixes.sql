UPDATE wishes
SET aiPlan = json_set(
  aiPlan,
  '$.roadmap',
  json((
    SELECT json_group_array(json(updated_step))
    FROM (
      SELECT
        CASE
          WHEN substr(json_extract(roadmap_item.value, '$.phase'), 1, 2) = '阶段'
            AND instr(
              '零〇一二三四五六七八九十百两0123456789',
              substr(json_extract(roadmap_item.value, '$.phase'), 3, 1)
            ) > 0
            AND instr(json_extract(roadmap_item.value, '$.phase'), '：') > 0
          THEN json_set(
            roadmap_item.value,
            '$.phase',
            trim(substr(
              json_extract(roadmap_item.value, '$.phase'),
              instr(json_extract(roadmap_item.value, '$.phase'), '：') + 1
            ))
          )
          WHEN substr(json_extract(roadmap_item.value, '$.phase'), 1, 2) = '阶段'
            AND instr(
              '零〇一二三四五六七八九十百两0123456789',
              substr(json_extract(roadmap_item.value, '$.phase'), 3, 1)
            ) > 0
            AND instr(json_extract(roadmap_item.value, '$.phase'), ':') > 0
          THEN json_set(
            roadmap_item.value,
            '$.phase',
            trim(substr(
              json_extract(roadmap_item.value, '$.phase'),
              instr(json_extract(roadmap_item.value, '$.phase'), ':') + 1
            ))
          )
          WHEN substr(json_extract(roadmap_item.value, '$.phase'), 1, 6) = 'Phase '
            AND instr(
              '0123456789',
              substr(json_extract(roadmap_item.value, '$.phase'), 7, 1)
            ) > 0
            AND instr(json_extract(roadmap_item.value, '$.phase'), ':') > 0
          THEN json_set(
            roadmap_item.value,
            '$.phase',
            trim(substr(
              json_extract(roadmap_item.value, '$.phase'),
              instr(json_extract(roadmap_item.value, '$.phase'), ':') + 1
            ))
          )
          ELSE roadmap_item.value
        END AS updated_step
      FROM json_each(wishes.aiPlan, '$.roadmap') AS roadmap_item
      ORDER BY CAST(roadmap_item.key AS INTEGER)
    )
  ))
)
WHERE json_valid(aiPlan)
  AND json_type(aiPlan, '$.roadmap') = 'array'
  AND EXISTS (
    SELECT 1
    FROM json_each(wishes.aiPlan, '$.roadmap') AS roadmap_item
    WHERE (
      substr(json_extract(roadmap_item.value, '$.phase'), 1, 2) = '阶段'
      AND instr(
        '零〇一二三四五六七八九十百两0123456789',
        substr(json_extract(roadmap_item.value, '$.phase'), 3, 1)
      ) > 0
      AND (
        instr(json_extract(roadmap_item.value, '$.phase'), '：') > 0
        OR instr(json_extract(roadmap_item.value, '$.phase'), ':') > 0
      )
    )
    OR (
      substr(json_extract(roadmap_item.value, '$.phase'), 1, 6) = 'Phase '
      AND instr(
        '0123456789',
        substr(json_extract(roadmap_item.value, '$.phase'), 7, 1)
      ) > 0
      AND instr(json_extract(roadmap_item.value, '$.phase'), ':') > 0
    )
  );
