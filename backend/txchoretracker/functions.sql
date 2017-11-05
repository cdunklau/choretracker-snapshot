START TRANSACTION ISOLATION LEVEL SERIALIZABLE;

--
-- Public DB API
--
CREATE SCHEMA IF NOT EXISTS api;
COMMENT ON SCHEMA api
  IS 'public choretracker database API';



/*
Fetch the user's profile.

Raises exceptions:
  DETAIL = 'NO_SUCH_USER'
    If the user does not exist
  DETAIL = 'NO_PROFILE_FOR_USER'
    If the user has no profile stored
*/
CREATE OR REPLACE FUNCTION
  api.fetch_user_profile(requesting_user_id BIGINT)
RETURNS TABLE (
  user_id BIGINT,
  email VARCHAR,
  display_name VARCHAR,
  email_verified BOOLEAN
) AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM "user" WHERE "user".id = requesting_user_id) THEN
    RAISE EXCEPTION
      'no user with id %', requesting_user_id
    USING
      DETAIL = 'NO_SUCH_USER'
    ;
  END IF;

  RETURN QUERY
    SELECT
      user_profile.user_id
        AS user_id,
      user_profile.email
        AS email,
      user_profile.display_name
        AS display_name,
      user_profile.email_verified
        AS email_verified
    FROM user_profile
    WHERE user_profile.user_id = requesting_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'no profile found for user id %', requesting_user_id
    USING
      DETAIL = 'NO_PROFILE_FOR_USER'
    ;
  END IF;

  RETURN;

END;
$$ LANGUAGE plpgsql;



/*
Create or update the user's profile. If the provided email does not
match the one stored, reset email_verified to FALSE.
*/
CREATE OR REPLACE FUNCTION
  api.create_or_update_user_profile(
    requesting_user_id BIGINT,
    provided_email VARCHAR,
    provided_display_name VARCHAR
  )
RETURNS TABLE (
  user_id BIGINT,
  email VARCHAR,
  display_name VARCHAR,
  email_verified BOOLEAN
) AS $$
DECLARE
  stored_email VARCHAR;
  stored_email_verified BOOLEAN;
  new_email_verified BOOLEAN := FALSE;
BEGIN
  -- TODO: Should probably raise an exception if the user doesn't exist.
  SELECT email, email_verified
  INTO stored_email, stored_email_verified
  FROM user_profile WHERE user_profile.user_id = requesting_user_id;

  IF FOUND THEN
    IF stored_email = provided_email THEN
      new_email_verified = stored_email_verified;
    ELSE
      new_email_verified = FALSE;
    END IF;
    RETURN QUERY
      UPDATE user_profile SET
        user_id = requesting_user_id,
        email = provided_email,
        display_name = provided_display_name,
        email_verified = new_email_verified
      WHERE user_profile.user_id = requesting_user_id
      RETURNING
        user_profile.user_id
          AS user_id,
        user_profile.email
          AS email,
        user_profile.display_name
          AS display_name,
        user_profile.email_verified
          AS email_verified;
  ELSE
    RETURN QUERY
      INSERT INTO user_profile
      (user_id, email, display_name)
      VALUES
      (requesting_user_id, provided_email, provided_display_name)
      RETURNING
        user_profile.user_id
          AS user_id,
        user_profile.email
          AS email,
        user_profile.display_name
          AS display_name,
        user_profile.email_verified
          AS email_verified;
  END IF;

  RETURN;

END;
$$ LANGUAGE plpgsql;


/*
Fetch the user ID for a given Google Sign In ID.
If the user does not exist, insert a new one.
*/
CREATE OR REPLACE FUNCTION
  api.google_auth_fetch_existing_user_id_or_create(
    user_google_uid VARCHAR,
    OUT existing_or_new_user_id BIGINT,
    OUT has_profile BOOLEAN
  )
RETURNS record AS $$
BEGIN
  SELECT
    google_auth.user_id as user_id,
    EXISTS(
      SELECT 1
      FROM user_profile
      WHERE user_profile.user_id = google_auth.user_id
      LIMIT 1
    )
  INTO
    existing_or_new_user_id, has_profile
  FROM google_auth WHERE google_auth.google_uid = user_google_uid;

  IF NOT FOUND THEN

    has_profile = FALSE;

    WITH new_user AS (
      INSERT INTO "user" DEFAULT VALUES RETURNING "user".id AS new_user_id
    )
    INSERT INTO google_auth (
      google_uid,
      user_id
    ) VALUES (
      user_google_uid,
      (SELECT new_user_id FROM new_user)
    )
    RETURNING google_auth.user_id
    INTO existing_or_new_user_id;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;


/*
Fetch all tasks for which the requesting user is in
the task's task_group.
*/
CREATE OR REPLACE FUNCTION
  api.asuser_fetch_all_tasks(requesting_user_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  task_group_id BIGINT,
  name VARCHAR,
  description VARCHAR,
  due_unix INTEGER,
  created_unix INTEGER,
  modified_unix INTEGER
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      task.id
        as id,
      task.task_group_id
        as task_group_id,
      task.name
        as name,
      task.description
        as description,
      api_impl.timestamp_to_unix_integer(task.due)
        as due_unix,
      api_impl.timestamp_to_unix_integer(task.created)
        as created_unix,
      api_impl.timestamp_to_unix_integer(task.modified)
        as modified_unix
      FROM task
      INNER JOIN users_m2m_task_groups u2tg
      ON
        u2tg.task_group_id = task.task_group_id
        AND u2tg.user_id = requesting_user_id
      ORDER BY due ASC
    ;
  RETURN;
END;
$$ LANGUAGE plpgsql;


/*
Fetch the specific task by ID.

Raises exceptions:
  DETAIL = 'NO_SUCH_TASK'
    if the task with the specified ID doesn't exist
  DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    if the user isn't in the task's task group (but the task exists)
*/
CREATE OR REPLACE FUNCTION
  api.asuser_fetch_task(requesting_user_id BIGINT, requested_task_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  task_group_id BIGINT,
  name VARCHAR,
  description VARCHAR,
  due_unix INTEGER,
  created_unix INTEGER,
  modified_unix INTEGER
) AS $$
BEGIN
  IF NOT api_impl.does_task_exist(requested_task_id) THEN
    RAISE EXCEPTION
      'no task found for id %', requested_task_id
    USING
      DETAIL = 'NO_SUCH_TASK'
    ;
  END IF;

  IF NOT api_impl.is_user_in_task_group_for_task(
    requesting_user_id, requested_task_id)
  THEN
    RAISE EXCEPTION
      'user with ID % not in task group for task %',
        requesting_user_id,
        requested_task_id
    USING
      DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    ;
  END IF;

  RETURN QUERY
    SELECT
      task.id
        as id,
      task.task_group_id
        as task_group_id,
      task.name
        as name,
      task.description
        as description,
      api_impl.timestamp_to_unix_integer(task.due)
        as due_unix,
      api_impl.timestamp_to_unix_integer(task.created)
        as created_unix,
      api_impl.timestamp_to_unix_integer(task.modified)
        as modified_unix
      FROM task
      WHERE task.id = requested_task_id
    ;
  RETURN;
END;
$$ LANGUAGE plpgsql;


/*
Create a new task for the requesting user in
the specified task group.

Raises exception:
  DETAIL = 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP'
    if the user is not a member of the new task's task group.
*/
CREATE OR REPLACE FUNCTION
  api.asuser_create_task(
    requesting_user_id BIGINT,
    new_task_group_id BIGINT,
    new_task_name VARCHAR,
    new_task_description VARCHAR,
    new_task_due_unix INTEGER
  )
RETURNS TABLE (
  id BIGINT,
  task_group_id BIGINT,
  name VARCHAR,
  description VARCHAR,
  due_unix INTEGER,
  created_unix INTEGER,
  modified_unix INTEGER
) AS $$
BEGIN
  IF
    NOT api_impl.is_user_in_task_group(requesting_user_id, new_task_group_id)
  THEN
    RAISE EXCEPTION
      'user with id % cannot access task group %',
        requesting_user_id,
        new_task_group_id
    USING
      DETAIL = 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP'
    ;
  END IF;

  RETURN QUERY
    INSERT INTO task
      (task_group_id, name, description, due, created, modified)
    VALUES
      (
        new_task_group_id, new_task_name, new_task_description,
        to_timestamp(new_task_due_unix), now(), now()
      )
    RETURNING
      task.id
        as id,
      task.task_group_id
        as task_group,
      task.name
        as name,
      task.description
        as description,
      api_impl.timestamp_to_unix_integer(task.due)
        as due_unix,
      api_impl.timestamp_to_unix_integer(task.created)
        as created,
      api_impl.timestamp_to_unix_integer(task.modified)
        as modified
    ;
  RETURN;
END;
$$ LANGUAGE plpgsql;


/*
Update an existing task if the requesting user is in the
task's current task group as well as in the (possibly different)
updated task group.

Raises exception:
  DETAIL = 'NO_SUCH_TASK'
    if the task doesn't exist
  DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    if the user is not a member of task's current task group.
  DETAIL = 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP'
    if the user is not a member of the updated task group.
*/
CREATE OR REPLACE FUNCTION
  api.asuser_update_task(
    requesting_user_id BIGINT,
    task_id_to_update BIGINT,
    updated_task_group_id BIGINT,
    updated_task_name VARCHAR,
    updated_task_description VARCHAR,
    updated_task_due_unix INTEGER
  )
RETURNS TABLE (
  id BIGINT,
  task_group_id BIGINT,
  name VARCHAR,
  description VARCHAR,
  due_unix INTEGER,
  created_unix INTEGER,
  modified_unix INTEGER
) AS $$
BEGIN
  IF
    NOT api_impl.does_task_exist(task_id_to_update)
  THEN
    RAISE EXCEPTION
      'task does not exist with id %', task_id_to_update
    USING
      DETAIL = 'NO_SUCH_TASK'
    ;
  END IF;

  IF
    NOT api_impl.is_user_in_task_group_for_task(
      requesting_user_id, task_id_to_update)
  THEN
    RAISE EXCEPTION
      'user with id % cannot access task group for task id %',
        requesting_user_id,
        task_id_to_update
    USING
      DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    ;
  END IF;

  IF
    NOT api_impl.is_user_in_task_group(
      requesting_user_id, updated_task_group_id)
  THEN
    RAISE EXCEPTION
      'user with id % cannot access requested task group % for task id %',
        requesting_user_id,
        updated_task_group_id,
        task_id_to_update
    USING
      DETAIL = 'USER_NOT_MEMBER_OF_REQUESTED_TASK_GROUP'
    ;
  END IF;

  RETURN QUERY
    UPDATE task SET
      task_group_id = updated_task_group_id,
      name = updated_task_name,
      description = updated_task_description,
      due = to_timestamp(updated_task_due_unix),
      modified = now()
    WHERE
      task.id = task_id_to_update
    RETURNING
      task.id
        as id,
      task.task_group_id
        as task_group,
      task.name
        as name,
      task.description
        as description,
      api_impl.timestamp_to_unix_integer(task.due)
        as due_unix,
      api_impl.timestamp_to_unix_integer(task.created)
        as created,
      api_impl.timestamp_to_unix_integer(task.modified)
        as modified
    ;
  RETURN;
END;
$$ LANGUAGE plpgsql;


/*
Delete an existing task if the requesting user in
the task's task group.

Raises exception:
  DETAIL = 'NO_SUCH_TASK'
    if the task doesn't exist
  DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    if the user is not a member of task's current task group.
*/
CREATE OR REPLACE FUNCTION
  api.asuser_delete_task(
    requesting_user_id BIGINT,
    task_id_to_delete BIGINT
  )
-- TODO: Update this to return success/failure
RETURNS void AS $$
BEGIN
  IF
    NOT api_impl.does_task_exist(task_id_to_delete)
  THEN
    RAISE EXCEPTION
      'task does not exist with id %', task_id_to_delete
    USING
      DETAIL = 'NO_SUCH_TASK'
    ;
  END IF;

  IF
    NOT api_impl.is_user_in_task_group_for_task(
      requesting_user_id, task_id_to_delete)
  THEN
    RAISE EXCEPTION
      'user with id % cannot access task group for task id %',
        requesting_user_id,
        task_id_to_delete
    USING
      DETAIL = 'USER_NOT_MEMBER_OF_TASK_GROUP'
    ;
  END IF;

  DELETE FROM task WHERE task.id = task_id_to_delete;

END;
$$ LANGUAGE plpgsql;


--
-- Private implementation details
--
CREATE SCHEMA IF NOT EXISTS api_impl;
COMMENT ON SCHEMA api
  IS 'private implementation details for choretracker database API';


CREATE OR REPLACE FUNCTION
  api_impl.timestamp_to_unix_integer(ts timestamp)
RETURNS integer AS $$
BEGIN
  RETURN cast(extract(epoch from ts) as integer);
END $$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
  api_impl.does_task_exist(requested_task_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM task
    WHERE task.id = requested_task_id
    LIMIT 1
  );
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
  api_impl.is_user_in_task_group(
    requesting_user_id BIGINT, requested_task_group_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM users_m2m_task_groups u2tg
    WHERE
      u2tg.task_group_id = requested_task_group_id
      AND u2tg.user_id = requesting_user_id
    LIMIT 1
  );
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
  api_impl.is_user_in_task_group_for_task(
    requesting_user_id BIGINT, requested_task_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM
      task INNER JOIN users_m2m_task_groups u2tg
    ON
      task.task_group_id = u2tg.task_group_id
    WHERE
      u2tg.user_id = requesting_user_id
    LIMIT 1
  );
END
$$ LANGUAGE plpgsql;
-- Bookkeeping: Ensure no function names appear twice in case
-- the function signature was changed.
DO LANGUAGE plpgsql $$
DECLARE
  dupefuncs_delimited VARCHAR;
BEGIN
  RAISE INFO 'Checking for duplicated functions';

  SELECT
    string_agg(dupefuncs.schema_and_func_name, ', ')
  INTO
    dupefuncs_delimited
  FROM (
    SELECT
      specific_schema || '.' || routine_name
        AS schema_and_func_name
    FROM information_schema.routines
    WHERE
      routine_type='FUNCTION'
      AND specific_schema IN ('api', 'api_impl')
    GROUP BY specific_schema, routine_name
    HAVING count(*) > 1
  ) AS dupefuncs;

  IF dupefuncs_delimited IS NOT NULL
  THEN
    RAISE EXCEPTION
      'Duplicated function(s) found: %', dupefuncs_delimited;
  ELSE
    RAISE INFO 'No duplicated functions found';
  END IF;
END$$;

COMMIT TRANSACTION;
