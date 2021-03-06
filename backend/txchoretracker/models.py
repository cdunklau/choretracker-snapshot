"""
Application models and marshmallow schemas for deserializing
client-provided JSON into models.

The names of the fields match the database table columns to make
`SomeModel(**databaseRow)` possible.
"""
import attr
import marshmallow as mm

# JSON structure --schema.load()--> App obj
# App obj --schema.dump()--> JSON structure


_LAST_UNIX = 2 ** 31 - 1

def _UnixTimeInteger(**kwargs):
    if 'validate' in kwargs:
        # Ensure the validator doesn't get overwritten.
        raise TypeError(
            'Cannot specify custom validator with _UnixTimeInteger')
    return mm.fields.Integer(
        validate=mm.validate.Range(min=0, max=_LAST_UNIX),
        **kwargs)


@attr.s
class UserProfile:
    """
    User details that are unrelated to authentication.
    """
    email = attr.ib()
    display_name = attr.ib()
    user_id = attr.ib(default=None)
    email_verified = attr.ib(default=False)


class UserProfileSchema(mm.Schema):
    email = mm.fields.String(
        required=True,
        validate=mm.validate.Email())
    display_name = mm.fields.String(
        required=True,
        load_from='displayName',
        dump_to='displayName',
        validate=mm.validate.Regexp(r'^\S.*\S$'))
    user_id = mm.fields.Integer(
        dump_only=True,
        dump_to='userId')
    email_verified = mm.fields.Boolean(
        dump_only=True,
        dump_to='emailVerified')

    # Make sure the input to dump() is an attrs class instance
    # (attr.asdict will throw if it's not).
    @mm.pre_dump
    def deserialize_user_profile(self, user):
        return attr.asdict(user)

    @mm.post_load
    def make_user_profile(self, validated):
        return UserProfile(**validated)


@attr.s
class Task:
    task_group_id = attr.ib()
    name = attr.ib()
    description = attr.ib(repr=False)
    due_unix = attr.ib()
    id = attr.ib(default=None)
    created_unix = attr.ib(default=None)
    modified_unix = attr.ib(default=None)


class TaskSchema(mm.Schema):
    id = mm.fields.Integer(
        dump_only=True)
    task_group_id = mm.fields.Integer(
        required=True,
        load_from='taskGroup',
        dump_to='taskGroup',
        validate=mm.validate.Range(min=0))
    name = mm.fields.String(
        required=True,
        validate=mm.validate.Length(min=1))
    description = mm.fields.String(
        required=True)
    due_unix = _UnixTimeInteger(
        required=True,
        load_from='due',
        dump_to='due')
    created_unix = _UnixTimeInteger(
        # No load_from because it's dump-only
        dump_to='created',
        dump_only=True)
    modified_unix = _UnixTimeInteger(
        # No load_from because it's dump-only
        dump_to='modified',
        dump_only=True)

    def __init__(self, *args, **kwargs):
        # Default to strict and not partial
        kwargs.setdefault('strict', True)
        kwargs.setdefault('partial', False)
        super().__init__(*args, **kwargs)


    # Make sure the input to dump() is an attrs class instance
    # (attr.asdict will throw if it's not).
    @mm.pre_dump(pass_many=True)
    def deserialize_task(self, task_or_tasks, many):
        if many:
            return [attr.asdict(task) for task in task_or_tasks]
        else:
            return attr.asdict(task_or_tasks)

    @mm.post_load
    def make_task(self, validated):
        return Task(**validated)
