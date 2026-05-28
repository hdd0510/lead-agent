"""GET/POST/PATCH/DELETE /rules — rule CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Rule
from schemas.models import RuleCreate, RulePatch, RuleOut

router = APIRouter(tags=["rules"])


@router.get("/rules", response_model=list[RuleOut])
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rule).order_by(Rule.created_at.asc()))
    return [RuleOut.model_validate(r) for r in result.scalars().all()]


@router.post("/rules", response_model=RuleOut, status_code=201)
async def create_rule(body: RuleCreate, db: AsyncSession = Depends(get_db)):
    rule = Rule(description=body.description, action=body.action, enabled=body.enabled)
    db.add(rule)
    await db.flush()
    return RuleOut.model_validate(rule)


@router.patch("/rules/{rule_id}", response_model=RuleOut)
async def patch_rule(
    rule_id: str, body: RulePatch, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")

    updates = body.model_dump(exclude_none=True)
    if updates:
        await db.execute(update(Rule).where(Rule.id == rule_id).values(**updates))
        await db.flush()
        result = await db.execute(select(Rule).where(Rule.id == rule_id))
        rule = result.scalar_one()

    return RuleOut.model_validate(rule)


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rule).where(Rule.id == rule_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
    await db.execute(delete(Rule).where(Rule.id == rule_id))
    await db.flush()
