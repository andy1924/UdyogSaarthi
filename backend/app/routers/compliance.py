from fastapi import APIRouter, Query
from app.schemas.compliance import ComplianceOut, LicenseItem

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

RULES = {
    "dairy": [LicenseItem(id="udyam", label="Udyam Registration", desc="MSME registration via udyamregistration.gov.in"), LicenseItem(id="fssai", label="FSSAI Licence", desc="Food safety for milk/products"), LicenseItem(id="trade", label="Trade Licence", desc="Panchayat/municipal trade licence")],
    "food":  [LicenseItem(id="udyam", label="Udyam Registration", desc="MSME registration"), LicenseItem(id="fssai", label="FSSAI Licence", desc="Food safety"), LicenseItem(id="trade", label="Trade Licence", desc="Panchayat/municipal")],
    "retail": [LicenseItem(id="udyam", label="Udyam Registration", desc="MSME registration"), LicenseItem(id="trade", label="Trade Licence", desc="Panchayat/municipal"), LicenseItem(id="gst", label="GST Registration", desc="If turnover > threshold")],
    "electronics": [LicenseItem(id="udyam", label="Udyam Registration", desc="MSME"), LicenseItem(id="trade", label="Trade Licence", desc="Panchayat/municipal")],
}
DEFAULT = [LicenseItem(id="udyam", label="Udyam Registration", desc="MSME registration"), LicenseItem(id="trade", label="Trade Licence", desc="Panchayat/municipal")]

@router.get("/licenses", response_model=ComplianceOut)
def licenses(business_category: str = Query(..., description="dairy, retail, food, electronics ...")):
    cat = business_category.lower().strip()
    lic = RULES.get(cat, DEFAULT)
    return ComplianceOut(business_category=cat, licenses=lic)
