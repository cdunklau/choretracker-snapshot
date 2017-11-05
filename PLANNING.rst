ChoreTracker
############

A short- and long-term repeating task tracker.

Use cases:

-   Household chores
-   Long-term household maintenance and cleaning
-   Car maintenance


Models:

-   Task
    -   name
    -   details (description of the task)
    -   due
    -   state (open, closed, perhaps in progress?)
    -   notes (filled in by completing user)
    -   manager M2O-> RepeatingTask
-   RepeatingTask - Manages multiple Tasks
    -   name
    -   details
    -   recurrance
    -   children O2M-> Task
-   TaskGroup - A grouping of related Tasks
-   User
-   User Group


Views:
-   Navigation bar
    -   simple count of overdue and due soon tasks
    -   navigate to all tasks, task groups, create task
-   All tasks
-   Tasks in a specific TaskGroup (button to create task in group)


General Features:

-   One-off tasks with name, description, due date/time
-   Repeating tasks
    -   Should we do this as a Recurrence? Would need to ensure that tasks
        stick around maybe?
-   Notifications via email, (facebook?)
-   Calendar event generation and cancellation (ICS format and/or Google
    Calendar)
-   User roles (admin, creator, regular user)
-   Support webhook (push) and websocket (subscribe) notifications?
-   Task ownership
-   Multistage tasks?

UI Features:

-   Show tasks that are overdue, due today, and due shortly (3 days?)
-   Create, edit and save, and delete tasks
-   Persist unsaved edits to tasks in browser local storage
-   Live updates of task create/edit/remove from server (websocket?)


Name ideas:

???


Stack:

-   Postgres
-   React
-   Django (+DRF?) or Pyramid or Twisted or asyncio/aiohttp/asyncpg

To Do
=====

Short-term
++++++++++

-   Add Task Groups to backend.
-   Finish adding taskGroup handling to frontend and add the task_group
    collection GET handler on the backend. (Maybe this is done already?)
-   Implement signon and profile on frontend. App should:
    -   Initially request /apis/profile to see if the user is logged in...
    -   If 403, display login page, then after login...
    -   Check if successful /apis/profile reponse shows that the user
        has a profile (it will 404 if not).
    -   If no profile, display profile edit page, otherwise display
        task groups page.
-   Set up SQLAlchemy migrations and a CLI tool to apply them.
-   Figure out a way to turn the frontend API client mock on and off
    in a nicer way.
-   Add polyfills for Object.values and Array.from.
-   Add more tests (unit and behavioral).
-   Add docstrings for all settled classes and functions.
-   Publish to github.

Mid-term
+++++++++

-   Update UI to display creation/modification timestamps.
-   Add "state" field to tasks. Call it "completed" or something, or do we also
    want to support in-progress? Calling it "status" and making it an enum
    would make that feature nicer.
-   Integrate a CSS framework (with SASS support).
-   Implement additional auth methods: Facebook, maybe username/password

Long-term
+++++++++

-   Review compatibility with browsers and provide polyfills as necessary.
-   Figure out and implement repeating tasks.
-   Support drafts: unsaved tasks saved in browser localStorage.


Feature Tests To Do
===================

These should be tested with selenium or similar, without any mocks/fakes/etc.

-   If the page is reloaded and a specific task is requested by the url,
    the application requests the task by ID directly to see if it exists
    before redirecting.

-   If a task is near the boundry of a different due category and the current
    time changes so that it should now be in a different category, the UI
    updates the color marking that task in TaskList, and the counts in the
    TasksDueStatusSummary, within TimeReferenceUpdater.intervalSeconds of the
    time change.

-   (requires websocket stuff) When one user creates, updates, or deletes a
    task, other user sessions shortly thereafter display the modification
    without reloading the page.
