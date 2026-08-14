-- Migrate legacy habit fields into habitsAndSystems, then remove the old keys.
UPDATE wishes
SET aiPlan = CASE
  WHEN json_valid(aiPlan) = 0 THEN aiPlan
  ELSE json_remove(
    CASE
      WHEN json_type(aiPlan, '$.habitsAndSystems') = 'array' THEN aiPlan
      WHEN json_type(aiPlan, '$.habitsAndTools') = 'array' THEN json_set(
        aiPlan,
        '$.habitsAndSystems',
        json(json_extract(aiPlan, '$.habitsAndTools'))
      )
      WHEN json_type(aiPlan, '$.habits') = 'array' THEN json_set(
        aiPlan,
        '$.habitsAndSystems',
        json(json_extract(aiPlan, '$.habits'))
      )
      ELSE aiPlan
    END,
    '$.habitsAndTools',
    '$.habits'
  )
END;
