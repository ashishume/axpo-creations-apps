"""Fixed monthly cost routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.fixed_cost import FixedCostCreate, FixedCostUpdate, FixedCostResponse
from app.teaching.services.fixed_cost import fixed_cost_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/fixed-costs", tags=["teaching-fixed-costs"])


@router.get("", response_model=list[FixedCostResponse])
async def list_fixed_costs(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id is not None:
        costs = await fixed_cost_service.list_by_session(db, session_id)
    else:
        costs = await fixed_cost_service.list_all(db)
    return [FixedCostResponse.model_validate(c) for c in costs]


@router.post("", response_model=FixedCostResponse)
async def create_fixed_cost(
    data: FixedCostCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    cost = await fixed_cost_service.create(db, data)
    return FixedCostResponse.model_validate(cost)


@router.post("/bulk", response_model=list[FixedCostResponse])
async def create_fixed_costs_bulk(
    data: list[FixedCostCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    costs = await fixed_cost_service.create_many(db, data)
    return [FixedCostResponse.model_validate(c) for c in costs]


@router.get("/{id}", response_model=FixedCostResponse)
async def get_fixed_cost(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    cost = await fixed_cost_service.get_or_404(db, id)
    return FixedCostResponse.model_validate(cost)


@router.patch("/{id}", response_model=FixedCostResponse)
async def update_fixed_cost(
    id: UUID,
    data: FixedCostUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    cost = await fixed_cost_service.update(db, id, data)
    return FixedCostResponse.model_validate(cost)


@router.delete("/{id}", status_code=204)
async def delete_fixed_cost(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await fixed_cost_service.delete(db, id)
