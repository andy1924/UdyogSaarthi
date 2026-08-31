from pydantic import BaseModel, Field

class NearbyProfile(BaseModel):
    id: str
    name: str
    category: str
    distance_m: int
    lat: float
    lon: float

class DirectoryOut(BaseModel):
    query: dict
    count: int
    profiles: list[NearbyProfile]
    sql: str = Field(description="ST_DWithin contract")
