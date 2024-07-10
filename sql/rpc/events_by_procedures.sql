create
or replace function events_by_procedures_ids (procedures_ids json) returns setof record language sql as $$
SELECT *
FROM doc_frise_events
WHERE procedure_id::text IN (SELECT value FROM jsonb_array_elements_text(procedures_ids::jsonb));
$$;
