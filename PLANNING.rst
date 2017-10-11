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

-   Condense various utility modules into ./src/utils/
-   Update UI to display creation/modification timestamps.
-   Add "state" field to tasks. Call it "completed" or something, or do we also
    want to support in-progress? Calling it "status" and making it an enum
    would make that feature nicer.
-   Add tests (unit and behavioral).
-   Publish to github.

Mid-term
+++++++++

-   Start work on backend.
-   Integrate a CSS framework (with SASS support).
-   Implement auth: Google, Facebook, username/password

Long-term
+++++++++

-   Figure out and implement repeating tasks
