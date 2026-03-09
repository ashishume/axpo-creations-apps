"""Organization routes."""
from uuid import UUID

from fastapi import APIRouter, Depends

from app.teaching.dependencies import (
    get_teaching_db_session,
    get_current_teaching_user,
    require_active_org_subscription,
)
from app.teaching.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.teaching.services.organization import organization_service
from app.teaching.models.user import User
from app.teaching.org_access import enforce_org_access
from app.core.exceptions import ForbiddenError

from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/organizations",
    tags=["teaching-organizations"],
    dependencies=[Depends(require_active_org_subscription)],
)


@router.post("", response_model=OrganizationResponse)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if user.organization_id:
        raise ForbiddenError("Only Super Admin can create organizations")
    org = await organization_service.create(db, data)
    return OrganizationResponse.model_validate(org)


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if user.organization_id:
        org = await organization_service.get(db, user.organization_id)
        return [OrganizationResponse.model_validate(org)] if org else []
    orgs = await organization_service.list_all(db)
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.get("/{id}", response_model=OrganizationResponse)
async def get_organization(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_org_access(db, user, id)
    org = await organization_service.get_or_404(db, id)
    return OrganizationResponse.model_validate(org)


@router.patch("/{id}", response_model=OrganizationResponse)
async def update_organization(
    id: UUID,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    await enforce_org_access(db, user, id)
    org = await organization_service.update(db, id, data)
    return OrganizationResponse.model_validate(org)


@router.delete("/{id}", status_code=204)
async def delete_organization(
    id: UUID,
    db: AsyncSession = Depends(get_teaching_db_session),
    user: User = Depends(get_current_teaching_user),
):
    if user.organization_id:
        raise ForbiddenError("Only Super Admin can delete organizations")
    await organization_service.delete(db, id)
