"""Stock movement routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.billing.dependencies import get_billing_db_session, get_current_billing_user
from app.billing.schemas.stock import StockMovementCreate, StockMovementResponse
from app.billing.services.stock import stock_service
from app.billing.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/stocks", tags=["billing-stocks"])


@router.post("", response_model=StockMovementResponse)
async def create_stock_movement(
    data: StockMovementCreate,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    movement = await stock_service.create(db, data)
    return StockMovementResponse.model_validate(movement)


@router.get("", response_model=list[StockMovementResponse])
async def list_stock_movements(
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    movements = await stock_service.list_all(db)
    return [StockMovementResponse.model_validate(m) for m in movements]


@router.get("/{id}", response_model=StockMovementResponse)
async def get_stock_movement(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    movement = await stock_service.get_or_404(db, id)
    return StockMovementResponse.model_validate(movement)


@router.delete("/{id}", status_code=204)
async def delete_stock_movement(
    id: UUID,
    db: AsyncSession = Depends(get_billing_db_session),
    user: User = Depends(get_current_billing_user),
):
    await stock_service.delete(db, id)
