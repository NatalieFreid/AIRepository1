# Instruction: TDD Splitting & Processing for D365FO

## Purpose

When a user provides a Technical Design Document (TDD) for a D365FO development task,
follow this instruction to split it into **per-object-type TDDs**, establish the correct
**processing sequence**, and optionally generate code for each part.

---

## Step 1 — Detect TDD Input

If the user message contains or attaches a TDD (structured document describing D365FO
objects to be created), activate this workflow automatically.

Indicators that a TDD is present:
- Document describes multiple D365FO objects (tables, classes, forms, reports, etc.)
- Document contains fields, methods, or data contract descriptions
- Document mentions a model name, label file, or AOT object names

---

## Step 2 — Extract Common Information

Before splitting, identify and record the **common header block** that must be copied
into **every** individual TDD. Extract only what is explicitly stated in the source TDD.
Do not invent or assume values.

Common fields to extract (if present):

| Field | Source in TDD |
|---|---|
| **Model name** | e.g. `AVARubinMuehle` |
| **Label file / Label ID prefix** | e.g. `AVA`, `@AVA:LabelId` |
| **Standard EDTs referenced** | e.g. `Name`, `Description`, `Amount`, `TransDate` |
| **Layer** | e.g. `ISV`, `USR` |
| **Prefix / naming convention** | e.g. `AVARUM` |
| **Project / feature context** | e.g. "Weighing Letter", "DSD Fee Report" |

This block will be inserted verbatim at the top of each individual TDD.

---

## Step 3 — Identify and Group Objects by Type

Parse the TDD and group all objects by their D365FO AOT type:

| # | Object Type | Examples |
|---|---|---|
| 1 | **EDT (Extended Data Type)** | Custom string/integer/enum EDTs |
| 2 | **Enum (Base Enum)** | Custom enumerations |
| 3 | **Table** | Permanent tables, TempDB/InMemory staging tables |
| 4 | **Map** | AOT Maps |
| 5 | **View** | AOT Views |
| 6 | **Data Contract Class** | `DataContractAttribute` classes |
| 7 | **Data Provider Class (RDP)** | `SRSReportDataProviderBase` subclasses |
| 8 | **Regular Class** | Helpers, service classes, builders |
| 9 | **Controller Class** | `SrsReportRunController` subclasses |
| 10 | **Form** | AOT Forms with datasources and controls |
| 11 | **SSRS Report (RDL)** | Report designs, datasets, parameters |
| 12 | **Output Menu Item** | `OutputMenuItems` pointing to a report |
| 13 | **Display Menu Item** | `DisplayMenuItems` pointing to a form |
| 14 | **Action Menu Item** | `ActionMenuItems` |
| 15 | **Security Privilege** | `SecurableObject` privilege definitions |
| 16 | **Security Duty** | Duty grouping privileges |
| 17 | **Security Role** | Role assignments (if defined in TDD) |
| 18 | **Number Sequence** | If a new number sequence reference is defined |
| 19 | **Batch Job Class** | `RunBaseBatch` / `SysOperationServiceBase` subclasses |

Only include types that actually appear in the source TDD.

---

## Step 4 — Create Individual TDDs

For each identified object, produce a separate TDD section or document with this structure:

```
## TDD — [ObjectType]: [ObjectName]

### Common Information
- Model:        <from common block>
- Label file:   <from common block>
- Prefix:       <from common block>
- Standard EDTs used: <list only EDTs referenced by this object>

### Object Details
<Copy only the relevant section from the original TDD for this object.
Do not add, infer, or expand any information beyond what is in the source TDD.>

### Fields / Properties
<Table or list as specified in the source TDD>

### Methods / Logic
<Only methods described in the source TDD>

### References / Dependencies
<Other objects from this TDD that this object depends on — filled automatically
based on dependency analysis in Step 5>
```

---

## Step 5 — Establish Processing Sequence

Use the following dependency rules to determine the order in which individual TDDs
should be processed (i.e., implemented):

```
EDT / Base Enum
    ↓
Table  (fields use EDTs and Enums)
    ↓
Map / View  (built on top of Tables)
    ↓
Data Contract Class  (may reference EDTs, Enums)
    ↓
Data Provider Class (RDP)  (uses Tables, Data Contract)
    ↓
Regular Class / Helper  (may use Tables, EDTs, Contracts)
    ↓
Batch Job Class  (uses Tables, Classes)
    ↓
Controller Class  (uses Data Provider, Data Contract)
    ↓
SSRS Report (RDL)  (uses Data Provider, Controller)
    ↓
Form  (uses Tables, Classes, may trigger Controller)
    ↓
Output Menu Item  (points to SSRS Report / Controller)
Display Menu Item  (points to Form)
Action Menu Item   (points to Class / Form)
    ↓
Security Privilege  (references Menu Items, Forms, Tables)
    ↓
Security Duty  (groups Privileges)
    ↓
Security Role  (groups Duties)
```

**Rules:**
- An object must not be listed before all of its dependencies are listed.
- If two objects of the same type have no dependency between them, they can be
  listed at the same level (parallel).
- Staging/TempDB tables that are owned by an RDP class are listed together with
  the RDP (after the permanent table group).

Present the final sequence as a numbered list, e.g.:

```
Processing Sequence:
 1. EDT — AVARUMWeightType
 2. Enum — AVARUMDSDFeePostedFilter
 3. Table — AVARUMDSDFeeTable
 4. Table (TempDB) — AVARUMDSDFeeTmp  [owned by RDP]
 5. Data Contract — AVARUMDSDFeeContract
 6. Data Provider — AVARUMDSDFeeDP
 7. Controller — AVARUMDSDFeeController
 8. SSRS Report — AVARUMDSDFee
 9. Output Menu Item — AVARUMDSDFeeOutput
10. Security Privilege — AVARUMDSDFeeView
11. Security Duty — AVARUMDSDFeeMaintain
```

---

## Step 6 — Confirm and Offer Next Step

After presenting the split TDDs and the processing sequence, always ask:

> **"The TDD has been split into [N] individual object TDDs with the processing sequence above.**
> **Would you like me to generate the X++ code for each TDD, one by one in processing order?"**

If the user confirms:
- Process each individual TDD in sequence order.
- Generate complete X++ / RDL / XML code for one object at a time.
- After each object, confirm before proceeding to the next.

---

## General Rules

- **Never add information** not present in the original TDD (no invented fields,
  methods, or default values unless they are D365FO framework requirements, e.g.
  mandatory `SysOperationDataContractAttribute` decorators).
- **Always copy** the common block (model, label file, prefix, EDTs) into each
  individual TDD.
- If the source TDD is **ambiguous or incomplete** for a specific object, note the
  gap explicitly with `⚠ TDD GAP: <description>` and do not fill it in.
- Use only standard D365FO EDTs where the original TDD specifies them; do not
  substitute custom EDTs for standard ones or vice versa.

---

*This instruction applies to all TDD processing tasks within the D365FO development workflow.*
