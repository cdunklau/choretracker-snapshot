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
-   Django (+DRF?)
