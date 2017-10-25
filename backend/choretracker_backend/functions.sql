START TRANSACTION ISOLATION LEVEL SERIALIZABLE;

CREATE SCHEMA IF NOT EXISTS api;
COMMENT ON SCHEMA api
  IS 'public choretracker database API';
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


/*
Fetch all tasks for which the requesting user is in
the task's task_group.
*/
CREATE OR REPLACE FUNCTION
  api.user_fetch_all_tasks(requesting_user_id BIGINT)
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
  api.user_fetch_task(requesting_user_id BIGINT, requested_task_id BIGINT)
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
  api.user_create_task(
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
  api.user_update_task(
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
  api.user_delete_task(
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
