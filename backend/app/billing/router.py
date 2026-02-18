"""Billing API router - mounts all billing routes at /billing/api/v1."""
from fastapi import APIRouter

from app.billing.routes import auth, companies, products, customers, invoices, payments, expenses, stocks

router = APIRouter()

router.include_router(auth.router)
router.include_router(companies.router)
router.include_router(products.router)
router.include_router(customers.router)
router.include_router(invoices.router)
router.include_router(payments.router)
router.include_router(expenses.router)
router.include_router(stocks.router)
