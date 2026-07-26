UPDATE wishes
SET blessings = MAX(blessings - 1, 0);
