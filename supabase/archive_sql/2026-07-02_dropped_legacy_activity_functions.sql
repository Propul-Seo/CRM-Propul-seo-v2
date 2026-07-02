-- =============================================================================
-- Archive avant DROP (migration 301, 2026-07-02)
-- Définitions exactes (pg_get_functiondef) des 4 fonctions supprimées.
-- Pour restaurer : rejouer le CREATE voulu ci-dessous.
-- Contexte : aucun appelant vivant (ni .rpc() front, ni trigger, ni fonction),
-- et leurs tables cibles (`activities`, `user_activities`) partent en corbeille
-- trash_2026_07_02 dans la même migration.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_bot_one_record_activity(p_record_id uuid, p_title text, p_description text DEFAULT NULL::text, p_activity_date timestamp with time zone DEFAULT now(), p_type text DEFAULT 'bot_one_record'::text, p_priority text DEFAULT 'moyenne'::text, p_status text DEFAULT 'a_faire'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  activity_id UUID;
  record_user_id UUID;
BEGIN
  SELECT user_id INTO record_user_id
  FROM crm_bot_one_records
  WHERE id = p_record_id;

  IF record_user_id IS NULL THEN
    RAISE EXCEPTION 'Enregistrement Bot One non trouvé: %', p_record_id;
  END IF;

  INSERT INTO crm_bot_one_activities (
    title, description, date_utc, type, priority, status,
    related_id, related_module, user_id
  ) VALUES (
    p_title, p_description, p_activity_date, p_type, p_priority, p_status,
    p_record_id, 'crm_bot_one', record_user_id
  ) RETURNING id INTO activity_id;

  PERFORM sync_bot_one_activity_to_main(
    jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'date_utc', p_activity_date,
      'type', p_type,
      'priority', p_priority,
      'status', p_status,
      'related_id', p_record_id
    )
  );

  RETURN activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_daily_stats(input_user_id uuid, target_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(user_id uuid, date date, calls_count bigint, meetings_count bigint, total_activities bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    input_user_id,
    target_date,
    COALESCE(calls.calls_count, 0) as calls_count,
    COALESCE(meetings.meetings_count, 0) as meetings_count,
    COALESCE(calls.calls_count, 0) + COALESCE(meetings.meetings_count, 0) as total_activities
  FROM (
    SELECT COUNT(*) as calls_count
    FROM user_activities
    WHERE user_activities.user_id = input_user_id
    AND user_activities.activity_type = 'call'
    AND DATE(user_activities.activity_date) = target_date
  ) calls
  CROSS JOIN (
    SELECT COUNT(*) as meetings_count
    FROM user_activities
    WHERE user_activities.user_id = input_user_id
    AND user_activities.activity_type = 'meeting'
    AND DATE(user_activities.activity_date) = target_date
  ) meetings;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_stats(input_user_id uuid)
 RETURNS TABLE(user_id uuid, total_calls bigint, total_meetings bigint, total_activities bigint, last_activity_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    input_user_id,
    COALESCE(calls.total_calls, 0) as total_calls,
    COALESCE(meetings.total_meetings, 0) as total_meetings,
    COALESCE(calls.total_calls, 0) + COALESCE(meetings.total_meetings, 0) as total_activities,
    activities.last_activity_date
  FROM (
    SELECT COUNT(*) as total_calls
    FROM user_activities
    WHERE user_activities.user_id = input_user_id
    AND user_activities.activity_type = 'call'
  ) calls
  CROSS JOIN (
    SELECT COUNT(*) as total_meetings
    FROM user_activities
    WHERE user_activities.user_id = input_user_id
    AND user_activities.activity_type = 'meeting'
  ) meetings
  CROSS JOIN (
    SELECT MAX(activity_date) as last_activity_date
    FROM user_activities
    WHERE user_activities.user_id = input_user_id
  ) activities;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_bot_one_activity_to_main(activity_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  main_activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    title, description, date_utc, type, priority, status, related_id, related_module
  ) VALUES (
    activity_data->>'title',
    activity_data->>'description',
    (activity_data->>'date_utc')::timestamptz,
    activity_data->>'type',
    activity_data->>'priority',
    activity_data->>'status',
    (activity_data->>'related_id')::uuid,
    'crm_bot_one'
  ) RETURNING id INTO main_activity_id;

  RETURN main_activity_id;
END;
$function$;
