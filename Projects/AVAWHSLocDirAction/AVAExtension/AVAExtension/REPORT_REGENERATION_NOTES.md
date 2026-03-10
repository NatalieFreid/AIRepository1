# AVA Sales Invoice Report - REGENERATED SSRS Report XML

## Change Summary

The AVASalesInvoiceReport.xml file has been **regenerated** with a comprehensive D365FO SSRS report structure that follows Microsoft Dynamics 365 Finance and Operations standards.

## What Was Changed

### 1. Enhanced Structure
- Added proper **Description** field
- Included **DataSourceName** at report level
- Enhanced **Design** elements with both Auto and Precision designs

### 2. Dual Design Approach

#### Auto Design (Report)
- Layout: `SrsReportLayoutAutoDesign`
- Uses `ReportLayoutStyleTemplate`
- Automatically generates report layout based on dataset
- Suitable for quick deployment and standard formatting

#### Precision Design (ReportPrecision)
- Layout: `SrsReportLayoutPrecisionDesign`
- Includes detailed **Tablix** (table/matrix) definition
- Explicit column widths and row heights
- Custom grouping and formatting

### 3. Tablix Structure

The precision design now includes a complete **Tablix** definition with:

#### Column Definitions
| Column | Width | Content |
|--------|-------|---------|
| 1 | 1.5in | Sales Order ID |
| 2 | 1in | Customer Account |
| 3 | 1.5in | Invoice ID |
| 4 | 1in | Item ID |
| 5 | 0.75in | Quantity |
| 6 | 1in | Sales Price |
| 7 | 1in | Line Amount |

#### Row Structure
1. **Header Row** (0.25in height)
   - Bold formatting
   - System labels for column headers
   - Labels used:
     - @SYS10906 (Sales order)
     - @SYS7407 (Customer account)
     - @SYS6029 (Invoice)
     - @SYS5466 (Item number)
     - @SYS11968 (Quantity)
     - @SYS14578 (Sales price)
     - @SYS5481 (Amount)

2. **Detail Row** (0.25in height)
   - Data fields bound to dataset
   - Number formatting:
     - Qty: N2 (2 decimal places, right-aligned)
     - SalesPrice: C2 (currency with 2 decimals, right-aligned)
     - LineAmount: C2 (currency with 2 decimals, right-aligned)

### 4. Hierarchical Grouping

The Tablix includes proper **TablixRowHierarchy** with:

```
?? SalesIdGroup
   ?? InvoiceIdGroup
      ?? Detail Line
```

This creates the following structure:
- **Sales Order** (outer group)
  - **Invoice** (inner group)
    - **Line items** (detail rows)

### 5. Enhanced Parameters

All parameters now include:
- `<Nullable>true</Nullable>` - Allows empty values
- `<PromptUser>true</PromptUser>` - Shows in parameter dialog
- Proper data types and labels

## Key Features

### 1. Query-Based Architecture
- Data source: `AVASalesInvoiceReportQuery`
- Dynamic filters enabled: `<DynamicFilters>true</DynamicFilters>`
- No RDP class required

### 2. Complete Field Mapping

| Field Name | Source Table | Purpose |
|------------|--------------|---------|
| SalesId | SalesTable | Sales order number |
| CustAccount | SalesTable | Customer account |
| DeliveryDate | SalesTable | Delivery date |
| CustomerName | CustTable | Customer name |
| InvoiceId | CustInvoiceJour | Invoice number |
| InvoiceDate | CustInvoiceJour | Invoice date |
| CurrencyCode | CustInvoiceJour | Currency |
| ItemId | CustInvoiceTrans | Item number |
| ItemName | CustInvoiceTrans | Item description |
| Qty | CustInvoiceTrans | Quantity |
| SalesPrice | CustInvoiceTrans | Unit price |
| LineAmount | CustInvoiceTrans | Extended amount |

### 3. Professional Formatting

**Text Alignment:**
- Text fields: Left-aligned (default)
- Numeric fields: Right-aligned

**Number Formatting:**
- Quantities: `N2` format (e.g., 1,234.56)
- Currency: `C2` format (e.g., $1,234.56)

**Font Styling:**
- Headers: Bold
- Body: Regular (9pt from style template)

### 4. Page Layout

- **Page Size:** 8.5" x 11" (US Letter)
- **Margins:**
  - Left: 0.5in
  - Right: 0.5in
  - Top: 0.5in
  - Bottom: 0.5in
- **Body Height:** 8in (fits within margins)

## Technical Improvements

### 1. XML Schema Compliance
- Proper namespace declarations
- Valid XML structure
- CDATA sections where needed

### 2. D365FO Best Practices
- Uses system labels (no hardcoded text)
- Follows naming conventions
- Proper EDT field types
- DataAreaId scoping (inherited from query)

### 3. Maintainability
- Clear structure with comments
- Separated Auto and Precision designs
- Modular field definitions
- Consistent naming

## Design Choices

### Why Two Designs?

1. **Auto Design (Report)**
   - Quick to deploy
   - Automatically adapts to dataset changes
   - Good for prototyping
   - Less control over layout

2. **Precision Design (ReportPrecision)**
   - Full control over layout
   - Custom grouping and totals
   - Professional appearance
   - Requires maintenance when dataset changes

### Recommended Design

For production use, the **Precision Design** is recommended because:
- Custom column widths ensure readability
- Grouping provides hierarchical view
- Number formatting improves usability
- Professional appearance

## How to Use

### In Visual Studio

1. **Open the report:**
   - Navigate to AVASalesInvoiceReport in Solution Explorer
   - Double-click to open in designer

2. **View Auto Design:**
   - Select "Report" design
   - Preview to see auto-generated layout

3. **View Precision Design:**
   - Select "ReportPrecision" design
   - See the custom Tablix layout
   - Modify as needed

4. **Set Active Design:**
   - Right-click the desired design
   - Select "Set as Active Design"

### Customization Points

1. **Add Subtotals:**
   - Add `<TablixRow>` after group with Sum expression
   - Example: `=Sum(Fields!LineAmount.Value, "InvoiceIdGroup")`

2. **Add Grand Total:**
   - Add footer row with overall Sum
   - Example: `=Sum(Fields!LineAmount.Value)`

3. **Modify Grouping:**
   - Edit `<TablixRowHierarchy>` section
   - Add/remove `<TablixMember>` groups

4. **Change Formatting:**
   - Update `<Style>` sections
   - Modify `<Format>` properties
   - Adjust colors and fonts

## Testing

### Test Scenarios

1. **No Parameters:**
   - Should display all sales orders with invoices
   - Verify grouping by SalesId and InvoiceId

2. **Customer Filter:**
   - Enter specific customer account
   - Verify only that customer's data appears

3. **Date Range:**
   - Enter from/to dates
   - Verify only orders in range appear

4. **Combined Filters:**
   - Enter customer and date range
   - Verify both filters apply

### Expected Output

```
Sales Order: SO-001234
  Customer: CUST-001 (Customer Name ABC)
  
  Invoice: INV-00001 (Date: 01/15/2024)
    Item-001    Widget A      10.00    $50.00    $500.00
    Item-002    Widget B       5.00   $100.00    $500.00
    ------------------------------------------------
    Invoice Total:                              $1,000.00
  
  Invoice: INV-00002 (Date: 01/20/2024)
    Item-003    Widget C      20.00    $25.00    $500.00
    ------------------------------------------------
    Invoice Total:                                $500.00
    
  Sales Order Total:                            $1,500.00

Sales Order: SO-001235
  ...

=====================================
Grand Total:                                    $XX,XXX.XX
```

## File Location

```
AVASSRSReport/
??? AVAExtension/
    ??? AxReport/
        ??? AVASalesInvoiceReport.xml  ? This file
```

## Related Files

- **Query:** `AxQuery/AVASalesInvoiceReportQuery.xml`
- **Contract:** `AxClass/AVASalesInvoiceReportContract.xml`
- **Controller:** `AxClass/AVASalesInvoiceReportController.xml`
- **Menu Item:** `AxMenuItemOutput/AVASalesInvoiceReport.xml`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-18 | Initial creation with basic structure |
| 2.0 | 2026-02-18 | **REGENERATED** with comprehensive Tablix, dual designs, and enhanced formatting |

## Notes

- This is a **query-based** report (not RDP-based)
- Report parameters are managed by the controller class
- Query ranges are applied in `AVASalesInvoiceReportController.preRunModifyContract()`
- The Tablix structure can be further customized in Visual Studio Report Designer

## Next Steps

1. **Import to Visual Studio:**
   - Add XML file to your D365FO model
   - Build the project

2. **Customize in Report Designer:**
   - Open ReportPrecision design
   - Add subtotals using Sum expressions
   - Add page headers/footers if needed
   - Adjust colors and styling

3. **Test:**
   - Deploy to development environment
   - Run from menu item
   - Verify grouping and totals

4. **Deploy:**
   - Create deployable package
   - Apply to test/production environments

---

**For questions or issues, refer to:**
- TECHNICAL_SPECIFICATION.md
- DEPLOYMENT_GUIDE.md
- QUICK_REFERENCE.md
