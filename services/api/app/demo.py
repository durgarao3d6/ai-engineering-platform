from fastapi import APIRouter, HTTPException

from .models import Check, Dataset, Payload, Run, RunResults

router = APIRouter(prefix="/v1/demo", tags=["Development sample data"])

dataset = Dataset(id="checkout-v1", name="Checkout", version="v1")
runs = {
    run.id: run
    for run in (
        Run(id="checkout-baseline", name="Checkout baseline", dataset_id=dataset.id,
            duration_ms=12500, estimated_cost_usd=0.024),
        Run(id="checkout-candidate", name="Checkout candidate", dataset_id=dataset.id,
            duration_ms=9700, estimated_cost_usd=0.021),
    )
}
results = {
    "checkout-baseline": RunResults(
        checks=[
            Check(name="Apply valid coupon", passed=True, summary="The run applied a 10% discount."),
            Check(name="Reject expired coupon", passed=False, summary="The run accepted an expired coupon."),
            Check(name="Preserve shipping total", passed=True, summary="The shipping total stayed unchanged."),
        ],
        trace=["Loaded checkout-v1 cases", "Applied baseline configuration", "Recorded one failed check"],
    ),
    "checkout-candidate": RunResults(
        checks=[
            Check(name="Apply valid coupon", passed=True, summary="The run applied a 10% discount."),
            Check(name="Reject expired coupon", passed=True, summary="The run rejected the expired coupon."),
            Check(name="Preserve shipping total", passed=True, summary="The shipping total stayed unchanged."),
        ],
        trace=["Loaded checkout-v1 cases", "Applied candidate configuration", "Recorded three passed checks"],
    ),
}


@router.get("/datasets")
def list_datasets() -> Payload[list[Dataset]]:
    return Payload(source="sample", data=[dataset])


@router.get("/runs")
def list_runs() -> Payload[list[Run]]:
    return Payload(source="sample", data=list(runs.values()))


@router.get("/runs/{run_id}")
def get_run(run_id: str) -> Payload[Run]:
    if run_id not in runs:
        raise HTTPException(404, "Run not found")
    return Payload(source="sample", data=runs[run_id])


@router.get("/runs/{run_id}/results")
def get_results(run_id: str) -> Payload[RunResults]:
    if run_id not in results:
        raise HTTPException(404, "Run not found")
    return Payload(source="sample", data=results[run_id])
