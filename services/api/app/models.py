from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class Payload(BaseModel, Generic[T]):
    source: Literal["sample", "workspace"]
    data: T


class Record(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Project(Record):
    id: str
    name: str


class Dataset(Record):
    id: str
    name: str
    version: str


class Run(Record):
    id: str
    name: str
    dataset_id: str
    duration_ms: int
    estimated_cost_usd: float


class Check(Record):
    name: str
    passed: bool
    summary: str


class RunResults(Record):
    checks: list[Check]
    trace: list[str]
