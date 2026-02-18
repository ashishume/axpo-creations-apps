"""Stock routes for teaching."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import get_teaching_db_session, get_current_teaching_user
from app.teaching.schemas.stock import StockCreate, StockUpdate, StockResponse
from app.teaching.services.stock import stock_service
from app.teaching.models.user import User

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/stocks", tags=["teaching-stocks"])


@router.post("", response_model=StockResponse)
async def create_stock(
    data: StockCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    stock = await stock_service.create(db, data)
    return StockResponse.model_validate(stock)


@router.get("", response_model=list[StockResponse])
async def list_stocks(
    session_id: UUID | None = None,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if session_id:
        stocks = await stock_service.list_by_session(db, session_id)
    else:
        stocks = await stock_service.list_all(db)
    return [StockResponse.model_validate(s) for s in stocks]


@router.post("/bulk", response_model=list[StockResponse])
async def create_stocks_bulk(
    data: list[StockCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    stocks = await stock_service.create_many(db, data)
    return [StockResponse.model_validate(s) for s in stocks]


@router.get("/{id}", response_model=StockResponse)
async def get_stock(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    stock = await stock_service.get_or_404(db, id)
    return StockResponse.model_validate(stock)


@router.patch("/{id}", response_model=StockResponse)
async def update_stock(
    id: UUID,
    data: StockUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    stock = await stock_service.update(db, id, data)
    return StockResponse.model_validate(stock)


@router.delete("/{id}", status_code=204)
async def delete_stock(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await stock_service.delete(db, id)
