# AVARUMCashSalesReport - Quick Reference

## ?? Component Overview

| Component | Name | Location | Status |
|-----------|------|----------|--------|
| Contract | AVARUMCashSalesReportContract | AxClass | ? Created |
| Data Provider | AVARUMCashSalesReportDP | AxClass | ? Created |
| Temp Table 1 | AVARUMCashSalesCashVoucherTmp | AxTable | ? Created |
| Temp Table 2 | AVARUMCashSalesDeskBalanceTmp | AxTable | ? Created |
| Report | AVARUMCashSalesReport | AxReport | ? Created |
| Menu Item | AVARUMCashSalesReport | AxMenuItemOutput | ? Created |

## ?? Data Flow

```
User selects date ? Contract (TransDate)
                           ?
                    Data Provider (DP)
                           ?
        ???????????????????????????????????????
        ?                                      ?
AVARUMCashSalesCashVoucher         AVARUMCashSalesDeskBalance
(filter by CreatedDateTime)         (filter by OpenAt)
        ?                                      ?
CashVoucherTmp                       DeskBalanceTmp
        ?                                      ?
        ???????????????????????????????????????
                           ?
                    SSRS Report
```

## ?? Key Methods

### Contract Class
```xpp
public void new()                           // Sets default date to today()
public TransDate parmTransDate(...)         // Gets/sets report date parameter
```

### Data Provider Class
```xpp
public void processReport()                 // Main data processing method
public AVARUMCashSalesCashVoucherTmp getCashVoucherTmp()  // Dataset 1
public AVARUMCashSalesDeskBalanceTmp getDeskBalanceTmp()  // Dataset 2
```

## ?? Field Mapping

### Dataset 1: Cash Voucher Tmp
| Field | Type | EDT |
|-------|------|-----|
| CashVoucher | String | AVARUMCashVoucher |
| GrossAmount | Real | AVARUMGrossAmount |
| NetAmount | Real | AVARUMNetAmount |
| AmountMST | Real | AVARUMVATAmount |
| AmountGiven | Real | AVARUMCashSalesDeskAmount |
| AmountBack | Real | AVARUMCashSalesDeskAmount |
| CashSalesDeskId | String | AVARUMCashSalesDeskId |

### Dataset 2: Desk Balance Tmp
| Field | Type | EDT |
|-------|------|-----|
| ClosedAt | UtcDateTime | AVARUMCashSalesDeskClosedAt |
| OpenAt | UtcDateTime | AVARUMCashSalesDeskOpenAt |
| DeskId | String | AVARUMCashSalesDeskId |
| OpenAmount | Real | AVARUMCashSalesDeskAmount |
| CloseAmount | Real | AVARUMCashSalesDeskAmount |
| SalesId | String | SalesId |

## ?? Deployment Checklist

- [x] Create contract class
- [x] Create data provider class  
- [x] Create temporary tables
- [x] Create report metadata
- [x] Create menu item
- [x] Build solution
- [ ] **Synchronize database**
- [ ] **Create .rdl report design in Visual Studio**
- [ ] **Deploy report to SSRS**
- [ ] Add to menu (optional)
- [ ] Test with data

## ??? Quick Commands

### Build Project
```
Ctrl + Shift + B (Visual Studio)
```

### Synchronize Database
```
Dynamics 365 > Synchronize database
```

### Deploy Reports
```
Dynamics 365 > Deploy Reports > Select AVARUMCashSalesReport
```

## ?? Support Notes

### Date Filtering
- Cash Voucher: Filters by `CreatedDateTime` field
- Desk Balance: Filters by `OpenAt` field
- Both use UTC DateTime range for the selected date

### Performance Tips
- Index on `CreatedDateTime` in AVARUMCashSalesCashVoucher
- Index on `OpenAt` in AVARUMCashSalesDeskBalance
- Consider date range limits for large datasets

### Common Modifications
1. **Change filter field**: Update `processReport()` method
2. **Add parameters**: Modify contract class and DP class
3. **Add calculated fields**: Add display methods to temp tables
4. **Custom dialog**: Create controller class extending SrsReportRunController

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Build Status**: ? SUCCESS  
**Version**: 1.0
