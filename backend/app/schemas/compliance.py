from pydantic import BaseModel


class LicenseItem(BaseModel):
    id: str
    label: str
    desc: str
    required: bool = True


class ComplianceOut(BaseModel):
    business_category: str
    licenses: list[LicenseItem]
