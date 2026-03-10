"""Stock routes for teaching."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_active_org_subscription,
)
from app.teaching.pagination import DEFAULT_PAGE_SIZE_STOCKS, MAX_PAGE_SIZE
from app.teaching.schemas.pagination import PaginatedResponse
from app.teaching.schemas.stock import (
    StockCreate,
    StockUpdate,
    StockResponse,
    StockTransactionCreate,
    StockTransactionResponse,
)
from app.teaching.services.stock import stock_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_session_access

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/stocks",
    tags=["teaching-stocks"],
    dependencies=[Depends(require_active_org_subscription)],
)


@router.post("", response_model=StockResponse)
async def create_stock(
    data: StockCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_session_access(db, user, data.session_id)
    stock = await stock_service.create(db, data)
    return StockResponse.model_validate(stock)


@router.get("", response_model=PaginatedResponse[StockResponse])
async def list_stocks(
    session_id: UUID | None = None,
    limit: int | None = None,
    offset: int = 0,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    page_size = min(limit or DEFAULT_PAGE_SIZE_STOCKS, MAX_PAGE_SIZE)
    if session_id:
        await enforce_session_access(db, user, session_id)
        items, total = await stock_service.list_by_session_paginated(
            db, session_id, limit=page_size, offset=offset
        )
    elif user.organization_id:
        items, total = await stock_service.list_by_organization_paginated(
            db, user.organization_id, limit=page_size, offset=offset
        )
    else:
        stocks = await stock_service.list_all(db)
        total = len(stocks)
        items = stocks[offset : offset + page_size]
    return PaginatedResponse(
        items=[StockResponse.model_validate(s) for s in items],
        total=total,
        limit=page_size,
        offset=offset,
        has_more=offset + len(items) < total,
    )


@router.post("/bulk", response_model=list[StockResponse])
async def create_stocks_bulk(
    data: list[StockCreate],
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    session_ids = {d.session_id for d in data}
    for sid in session_ids:
        await enforce_session_access(db, user, sid)
    stocks = await stock_service.create_many(db, data)
    return [StockResponse.model_validate(s) for s in stocks]


@router.get("/{id}", response_model=StockResponse)
async def get_stock(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    stock = await stock_service.get_or_404(db, id)
    await enforce_session_access(db, user, stock.session_id)
    return StockResponse.model_validate(stock)


@router.patch("/{id}", response_model=StockResponse)
async def update_stock(
    id: UUID,
    data: StockUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await stock_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    stock = await stock_service.update(db, id, data)
    return StockResponse.model_validate(stock)


@router.delete("/{id}", status_code=204)
async def delete_stock(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await stock_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    await stock_service.delete(db, id)


@router.post("/{id}/transactions", response_model=StockTransactionResponse)
async def add_stock_transaction(
    id: UUID,
    data: StockTransactionCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await stock_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    tx = await stock_service.add_transaction(db, id, data)
    return StockTransactionResponse.model_validate(tx)


@router.delete("/{id}/transactions/{transaction_id}", status_code=204)
async def delete_stock_transaction(
    id: UUID,
    transaction_id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    existing = await stock_service.get_or_404(db, id)
    await enforce_session_access(db, user, existing.session_id)
    deleted = await stock_service.delete_transaction(db, id, transaction_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
