from txchoretracker import models

_day = 24 * 60 * 60
CREATED = 1489453509
MODIFIED = CREATED + _day
DUE = MODIFIED + _day
NAME = 'some name'
DESCRIPTION = 'some description'


class TestTaskSchema:
    def test_serializes_correctly(self):
        task = models.Task(
            id=1,
            task_group_id=2,
            name=NAME,
            description=DESCRIPTION,
            due_unix=DUE,
            created_unix=CREATED,
            modified_unix=MODIFIED,
        )
        schema = models.TaskSchema(strict=True, partial=False)
        result, errors = schema.dump(task)
        expected = {
            'id': 1,
            'taskGroup': 2,  # No _id, camelCased
            'name': NAME,
            'description': DESCRIPTION,
            'due': DUE, # No _unix
            'created': CREATED,  # No _unix
            'modified': MODIFIED,  # No _unix
        }
        assert not errors
        assert result == expected

    def test_deserializes_correctly(self):
        json_structure = {
            'id': 1,
            'taskGroup': 2,
            'name': 'some name',
            'description': 'some description',
            'due': DUE,
            'created': CREATED,
            'modified': MODIFIED,
        }
        schema = models.TaskSchema(strict=True, partial=False)
        result, errors = schema.load(json_structure)
        expected = models.Task(
            # No id, created, or modified in deserialized task
            task_group_id=2,
            name=NAME,
            description=DESCRIPTION,
            due_unix=DUE,
        )
        assert not errors
        assert result == expected


class TestUserProfileSchema:
    def test_deserializes_correctly(self):
        json_structure = {
            'email': 'tgilliam@example.com',
            'displayName': 'Terry Gilliam',
            'userId': 123,  # Ignored
            'emailVerified': True,  # Ignored
        }
        schema = models.UserProfileSchema(strict=True, partial=False)
        result, errors = schema.load(json_structure)
        expected = models.UserProfile(
            email='tgilliam@example.com',
            display_name='Terry Gilliam',
        )
        assert not errors
        assert result == expected
