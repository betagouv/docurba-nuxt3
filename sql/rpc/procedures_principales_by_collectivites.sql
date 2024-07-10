create
or replace function procedures_principales_by_collectivites (codes json) returns setof record language sql as $$
SELECT p.*, array_agg(pp.*) AS procedures_perimetres
    FROM procedures p
    LEFT JOIN procedures_perimetres pp ON p.id = pp.procedure_id
    WHERE ((p.id IN (
        SELECT procedure_id
        FROM procedures_perimetres
        WHERE collectivite_code IN (
            SELECT json_array_elements_text(codes)
        )
    )) AND p.is_principale = true AND p.status IN ('opposable', 'en cours')) GROUP BY p.id;
$$;
