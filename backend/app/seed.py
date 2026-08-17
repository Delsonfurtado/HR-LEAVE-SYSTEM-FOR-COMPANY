from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.leave import LeaveRequest, LeaveType, RequestStatus
from app.models.user import Department, Role, User
from app.repositories import leave_repo, user_repo
from app.utils.dates import today, utcnow, working_days


def run_seed(db: Session) -> None:
    engineering = Department(name="Engineering")
    operations = Department(name="Operations")
    people = Department(name="People")
    db.add_all([engineering, operations, people])
    db.commit()

    annual = LeaveType(code="annual", name="Annual Leave", default_days=20, requires_document=False)
    sick = LeaveType(code="sick", name="Sick Leave", default_days=10, requires_document=True)
    casual = LeaveType(code="casual", name="Casual Leave", default_days=5, requires_document=False)
    db.add_all([annual, sick, casual])
    db.commit()

    users = [
        User(email="admin@secureleave.io", hashed_password=hash_password("Admin@123"), full_name="System Administrator", role=Role.admin, department_id=None),
        User(email="hr@secureleave.io", hashed_password=hash_password("Hr@12345"), full_name="Helena HR", role=Role.hr, department_id=people.id),
        User(email="eng.manager@secureleave.io", hashed_password=hash_password("Manager@123"), full_name="Eva Engineering Manager", role=Role.manager, department_id=engineering.id),
        User(email="dev@secureleave.io", hashed_password=hash_password("Employee@123"), full_name="Dev Employee", role=Role.employee, department_id=engineering.id),
        User(email="dev2@secureleave.io", hashed_password=hash_password("Employee@123"), full_name="Dev Two Employee", role=Role.employee, department_id=engineering.id),
        User(email="ops.manager@secureleave.io", hashed_password=hash_password("Manager@123"), full_name="Omar Operations Manager", role=Role.manager, department_id=operations.id),
        User(email="ops.worker@secureleave.io", hashed_password=hash_password("Employee@123"), full_name="Ops Worker", role=Role.employee, department_id=operations.id),
    ]
    db.add_all(users)
    db.commit()

    year = today().year
    for user in users:
        user_repo.init_balances_for_user(db, user, year, [annual, sick, casual])

    start = today() + timedelta(days=7)
    end = today() + timedelta(days=9)
    sample = LeaveRequest(
        employee_id=users[3].id,
        leave_type_id=annual.id,
        start_date=start,
        end_date=end,
        days=working_days(start, end),
        reason="Family event out of town",
        status=RequestStatus.pending,
        created_at=utcnow(),
    )
    db.add(sample)
    db.commit()


if __name__ == "__main__":
    from app.db import Base

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if user_repo.count_users(db) == 0:
            run_seed(db)
            print("Database seeded.")
        else:
            print("Database already contains users. Skipping seed.")
