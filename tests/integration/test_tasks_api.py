"""Integration tests for Task APIs, IDOR ownership isolation, and deletion."""

import pytest
from fastapi import BackgroundTasks, HTTPException
from votex_api.db import get_connection, init_db
from votex_api.models import User
from votex_api.repositories import TaskRepository, UserRepository
from votex_api.routers.tasks import delete_task, get_task, list_tasks
from votex_api.services import TaskService


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_task_lifecycle_and_idor():
    conn = get_connection()
    try:
        user_repo = UserRepository(conn)
        user1 = user_repo.get_by_email("smoke_user@example.test")
        user2 = user_repo.get_by_email("other_user@example.test")
        assert user1 and user2

        task_service = TaskService(conn)

        # 1. Create a task directly using TaskRepository
        task_id = "test-task-uuid-1234"
        created_task = task_service.task_repo.create_task(
            task_id=task_id,
            user_id=user1.id,
            prompt="Transcribe this speech sample into Hindi and summarize",
            workspace_rel_path=f"{user1.id}/{task_id}",
            max_steps=10,
            max_cost_inr=5.0,
            max_seconds=60,
        )
        assert created_task.id == task_id
        assert created_task.status == "queued"

        # 2. User 1 can view own task
        view1 = get_task(task_id, user1, task_service)
        assert view1.id == task_id
        assert view1.prompt == "Transcribe this speech sample into Hindi and summarize"

        # 3. IDOR CHECK: User 2 CANNOT view User 1's task (must raise 404)
        with pytest.raises(HTTPException) as exc_get:
            get_task(task_id, user2, task_service)
        assert exc_get.value.status_code == 404

        # 4. User 1 lists tasks
        user1_list = list_tasks(page=1, page_size=20, status=None, user=user1, task_service=task_service)
        assert any(t.id == task_id for t in user1_list.tasks)

        # User 2 list does NOT contain User 1's task
        user2_list = list_tasks(page=1, page_size=20, status=None, user=user2, task_service=task_service)
        assert not any(t.id == task_id for t in user2_list.tasks)

        # 5. IDOR CHECK: User 2 cannot delete User 1's task
        with pytest.raises(HTTPException) as exc_del:
            delete_task(task_id, user2, task_service, _csrf=None)
        assert exc_del.value.status_code == 404

        # 6. User 1 deletes own task
        delete_task(task_id, user1, task_service, _csrf=None)

        # 7. Task is now gone (404)
        with pytest.raises(HTTPException) as exc_gone:
            get_task(task_id, user1, task_service)
        assert exc_gone.value.status_code == 404
    finally:
        conn.close()
