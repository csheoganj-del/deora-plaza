-- Force Merge Duplicate Categories (Case Insensitive, Whitespace Trimmed)
DO $$
DECLARE
    target_id UUID;
    dup_id UUID;
    cat_name TEXT;
    -- The names we want to consolidate
    names TEXT[] := ARRAY['Food', 'Drinks', 'Specials'];
BEGIN
    FOREACH cat_name IN ARRAY names
    LOOP
        -- 1. Find the MASTER ID. 
        -- We pick the OLDER one (created_at ASC) as the master to keep links stable if possible.
        SELECT id INTO target_id 
        FROM categories 
        WHERE LOWER(TRIM(name)) = LOWER(cat_name)
        ORDER BY created_at ASC 
        LIMIT 1;

        IF target_id IS NOT NULL THEN
            RAISE NOTICE 'Merging duplicates for % into ID %', cat_name, target_id;

            -- 2. Find all OTHER IDs (duplicates)
            FOR dup_id IN 
                SELECT id FROM categories 
                WHERE LOWER(TRIM(name)) = LOWER(cat_name) 
                AND id != target_id
            LOOP
                RAISE NOTICE '  - Merging duplicate ID %', dup_id;

                -- Move Items from duplicate to master
                UPDATE menu_items 
                SET category_id = target_id 
                WHERE category_id = dup_id;
                
                -- Move Sub-Categories from duplicate to master
                UPDATE categories 
                SET parent_id = target_id 
                WHERE parent_id = dup_id;
                
                -- Delete the now-empty duplicate category
                DELETE FROM categories WHERE id = dup_id;
            END LOOP;
        END IF;
    END LOOP;
END $$;
