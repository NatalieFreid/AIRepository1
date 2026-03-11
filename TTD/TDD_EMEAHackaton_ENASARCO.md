# Technical Design Document — ENASARCO Process
**Model:** EMEAHackaton  
**D365FO Version:** 10.0.44  
**Prefix:** AVA  
**Based on FDD:** FDD_EvolveAI_Enasarco_process_v1  
**Author:** EME Hackathon prep team  
**Date:** 2026-03-10  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Model & Project Structure](#2-model--project-structure)
3. [Labels](#3-labels)
4. [Extended Data Types](#4-extended-data-types)
5. [New Tables](#5-new-tables)
6. [Table Extensions](#6-table-extensions)
7. [Data Entities](#7-data-entities)
8. [Forms](#8-forms)
9. [Menu Items & Menu Extensions](#9-menu-items--menu-extensions)
10. [Security](#10-security)
11. [Business Logic Classes](#11-business-logic-classes)
12. [Periodic Job — SysOperation Framework](#12-periodic-job--sysopeation-framework)
13. [Business Event](#13-business-event)
14. [CoC Extensions on Standard Objects](#14-coc-extensions-on-standard-objects)
15. [Key Algorithms](#15-key-algorithms)
16. [Testing Considerations](#16-testing-considerations)

---

## 1. Overview

This TDD describes the technical implementation of the ENASARCO process for the Italian legal entity of EvolveAI. ENASARCO is an Italian social security institution for commercial agents. When agents invoice services, a deduction (ENASARCO) must be recorded as a liability in accounting — both the portion deducted from the agent's invoice and the portion charged to EvolveAI company.

The customization covers:
- Identification of ENASARCO-relevant vendors.
- Parameter setup for rates, date ranges, minimum and maximum caps.
- Automatic creation of ENASARCO transaction records upon vendor invoice posting.
- A periodic General Ledger journal creation process (via SysOperation Framework).
- A Business Event to integrate the posted journal with Azure Integration Services.

> **Scope restriction:** All new functionality is guarded by `CountryRegionId = IT` and by the `AVAENASARCOParameters.EnasarcoEnabled` flag.

---

## 2. Model & Project Structure

| Property         | Value                          |
|------------------|--------------------------------|
| Model Name       | `EMEAHackaton`                 |
| Publisher        | Avanade                        |
| Layer            | VAR                            |
| Package          | `EMEAHackaton` (new package)   |
| Naming Prefix    | `AVA`                          |
| Label File       | `AVAEMEAHackaton`              |
| Label Languages  | `en-US`, `de`                  |

**VS Solution naming example:** `AVA_ENASARCO_EMEAHackaton`  
**VS Project naming example:** `AVA_ENASARCO_EMEAHackaton` (one project, one model)

---

## 3. Labels

Label file: `AVAEMEAHackaton.en-US.label.txt` and `AVAEMEAHackaton.de.label.txt`

| Label ID                              | en-US                                      | de                                              |
|---------------------------------------|--------------------------------------------|-------------------------------------------------|
| `@AVAEMEAHackaton:EnasarcoEnabled`    | Enasarco enabled                           | Enasarco aktiviert                              |
| `@AVAEMEAHackaton:CalcEnasarco`       | Calculate Enasarco                         | Enasarco berechnen                              |
| `@AVAEMEAHackaton:EnasarcoGroup`      | Enasarco                                   | Enasarco                                        |
| `@AVAEMEAHackaton:EnasarcoParams`     | Enasarco parameters                        | Enasarco-Parameter                              |
| `@AVAEMEAHackaton:EnasarcoPostParams` | Enasarco posting parameters                | Enasarco-Buchungsparameter                      |
| `@AVAEMEAHackaton:EnasarcoTransHdr`   | Enasarco transactions                      | Enasarco-Transaktionen                          |
| `@AVAEMEAHackaton:EnasarcoTransLines` | Enasarco transaction lines                 | Enasarco-Transaktionspositionen                 |
| `@AVAEMEAHackaton:CompanyCostAccount` | Company cost account                       | Unternehmenskostenkonto                         |
| `@AVAEMEAHackaton:LiabilityAccount`   | Liability account                          | Verbindlichkeitskonto                           |
| `@AVAEMEAHackaton:JournalName`        | Journal name                               | Journalname                                     |
| `@AVAEMEAHackaton:JournalDesc`        | Journal description                        | Journalbeschreibung                             |
| `@AVAEMEAHackaton:PostJournal`        | Post journal                               | Journal buchen                                  |
| `@AVAEMEAHackaton:FromDate`           | From date                                  | Von Datum                                       |
| `@AVAEMEAHackaton:ToDate`             | To date                                    | Bis Datum                                       |
| `@AVAEMEAHackaton:MinAmount`          | Min. amount                                | Mindestbetrag                                   |
| `@AVAEMEAHackaton:MaxAmount`          | Max. amount                                | Höchstbetrag                                    |
| `@AVAEMEAHackaton:PctEnasarcoInv`     | % Enasarco invoice                         | % Enasarco Rechnung                             |
| `@AVAEMEAHackaton:PctEnasarcoCmp`     | % Enasarco company                         | % Enasarco Unternehmen                          |
| `@AVAEMEAHackaton:VoucherInvoice`     | Voucher invoice                            | Rechnungsbeleg                                  |
| `@AVAEMEAHackaton:InvoiceAmtOrigin`   | Invoice amount origin                      | Rechnungsursprungsbetrag                        |
| `@AVAEMEAHackaton:EnasarcoInvTotal`   | Enasarco invoice total                     | Enasarco-Rechnungsgesamt                        |
| `@AVAEMEAHackaton:EnasarcoCmpTotal`   | Enasarco company total                     | Enasarco-Unternehmensgesamt                     |
| `@AVAEMEAHackaton:VoucherEnasarco`    | Voucher journal Enasarco                   | Enasarco-Journalbeleg                           |
| `@AVAEMEAHackaton:EnasarcoInvLine`    | Enasarco invoice line                      | Enasarco-Rechnungsposition                      |
| `@AVAEMEAHackaton:EnasarcoCmpLine`    | Enasarco company line                      | Enasarco-Unternehmensposition                   |
| `@AVAEMEAHackaton:PostEnasarco`       | Post Enasarco transactions                 | Enasarco-Transaktionen buchen                   |
| `@AVAEMEAHackaton:EnasarcoJournPosted`| Enasarco journal posted                    | Enasarco-Journal gebucht                        |
| `@AVAEMEAHackaton:ErrNoPostingParam`  | No Enasarco posting parameters found for date %1. | Keine Enasarco-Buchungsparameter für Datum %1 gefunden. |
| `@AVAEMEAHackaton:ErrDateOverlap`     | Posting parameter date ranges must not overlap. | Datumsangaben der Buchungsparameter dürfen sich nicht überschneiden. |
| `@AVAEMEAHackaton:ErrEnasarcoDisabled`| Enasarco is not enabled for this company.  | Enasarco ist für dieses Unternehmen nicht aktiviert. |
| `@AVAEMEAHackaton:InfoJournalCreated` | Enasarco journal %1 created successfully.  | Enasarco-Journal %1 wurde erfolgreich erstellt. |

---

## 4. Extended Data Types

All fields in this customization use **standard D365FO EDTs**. No new EDTs are required.

| Standard EDT         | Used for                                                    |
|----------------------|-------------------------------------------------------------|
| `NoYes`              | `EnasarcoEnabled`, `PostJournal`, `CalcEnasarco` (enum)     |
| `TransDate`          | `Date` (header)                                             |
| `LedgerVoucher`      | `VoucherInvoice`, `VoucherEnasarco`                         |
| `VendInvoiceId`      | `Invoice`                                                   |
| `VendAccount`        | `Supplier`                                                  |
| `AmountCur`          | `InvoiceAmountOrigin`, `EnasarcoInvTotal`, `EnasarcoCmpTotal`, `MinAmount`, `MaxAmount`, line amounts |
| `LineNum`            | `LineNumber`                                                |
| `LineAmount`         | `LineAmountOrigin`, `EnasarcoInvLine`, `EnasarcoCmpLine`     |
| `Percent`            | `PctEnasarcoInvoice`, `PctEnasarcoCompany`                  |
| `RefRecId`           | Foreign key fields                                          |
| `PurchCategoryId`    | `ProcurementCategory`                                       |
| `ItemId`             | `ItemId`                                                    |
| `JournalNameId`      | `JournalName`                                               |
| `Description`        | `JournalDescription`                                        |
| `MainAccountNum`     | `CompanyCostAccount`, `LiabilityAccount`                    |
| `FromDate`           | `FromDate`                                                  |
| `ToDate`             | `ToDate`                                                    |

---

## 5. New Tables

### 5.1 `AVAENASARCOParameters`

**Purpose:** Stores company-level ENASARCO configuration. Singleton per company (like other parameters tables).

**Model:** EMEAHackaton  
**Table type:** Regular  
**Cache lookup:** Found  
**Country Region Codes:** IT  
**Title Field 1:** `EnasarcoEnabled`

| Field Name             | EDT / Type       | Label ID                                   | Mandatory | Allow Edit | Notes                                          |
|------------------------|------------------|--------------------------------------------|-----------|------------|------------------------------------------------|
| `EnasarcoEnabled`      | `NoYes`          | `@AVAEMEAHackaton:EnasarcoEnabled`         | No        | Yes        | Master switch for ENASARCO in the company       |
| `CompanyCostAccount`   | `MainAccountNum` | `@AVAEMEAHackaton:CompanyCostAccount`      | No        | Yes        | Relation to `MainAccount`                      |
| `LiabilityAccount`     | `MainAccountNum` | `@AVAEMEAHackaton:LiabilityAccount`        | No        | Yes        | Relation to `MainAccount`                      |
| `JournalName`          | `JournalNameId`  | `@AVAEMEAHackaton:JournalName`             | No        | Yes        | Relation to `LedgerJournalName`                |
| `JournalDescription`   | `Description`    | `@AVAEMEAHackaton:JournalDesc`             | No        | Yes        |                                                |
| `PostJournal`          | `NoYes`          | `@AVAEMEAHackaton:PostJournal`             | No        | Yes        | Auto-post journal after creation               |

**Indexes:**

| Index Name     | Fields              | Properties          |
|----------------|---------------------|---------------------|
| `KeyIdx`       | `RecId`             | Primary Index = Yes |

**Relations:**

| Relation Name     | Related Table      | Field                | Related Field  | Validate | OnDelete    |
|-------------------|--------------------|----------------------|----------------|----------|-------------|
| `MainAccount_Cost`| `MainAccount`      | `CompanyCostAccount` | `MainAccountId`| Yes      | None        |
| `MainAccount_Liab`| `MainAccount`      | `LiabilityAccount`   | `MainAccountId`| Yes      | None        |
| `LedgerJournalName`| `LedgerJournalName`| `JournalName`       | `JournalName`  | Yes      | None        |

**Field groups:**

| Group Name    | Fields                                                                                    |
|---------------|-------------------------------------------------------------------------------------------|
| `AutoReport`  | `EnasarcoEnabled`, `JournalName`                                                          |
| `General`     | `EnasarcoEnabled`, `CompanyCostAccount`, `LiabilityAccount`, `JournalName`, `JournalDescription`, `PostJournal` |

**Static method `find()`:**
```xpp
/// <summary>
/// Finds the ENASARCO parameters record for the current company.
/// </summary>
/// <param name="_forUpdate">If true, the record is selected for update.</param>
/// <returns>The AVAENASARCOParameters record.</returns>
public static AVAENASARCOParameters find(boolean _forUpdate = false)
{
    AVAENASARCOParameters parameters;

    if (_forUpdate)
    {
        parameters.selectForUpdate(_forUpdate);
    }

    select firstonly parameters;

    return parameters;
}
```

---

### 5.2 `AVAENASARCOPostingParameters`

**Purpose:** Stores date-range based percentage and cap rules for ENASARCO calculation.

**Model:** EMEAHackaton  
**Table type:** Regular  
**Cache lookup:** None  
**Country Region Codes:** IT  
**Title Field 1:** `FromDate`  
**Title Field 2:** `ToDate`

| Field Name            | EDT / Type    | Label ID                                    | Mandatory | Notes                                  |
|-----------------------|---------------|---------------------------------------------|-----------|----------------------------------------|
| `FromDate`            | `FromDate`    | `@AVAEMEAHackaton:FromDate`                 | Yes       |                                        |
| `ToDate`              | `ToDate`      | `@AVAEMEAHackaton:ToDate`                   | No        | May be open-ended                      |
| `MinAmount`           | `AmountCur`   | `@AVAEMEAHackaton:MinAmount`                | Yes       | Minimum cumulative Enasarco deduction  |
| `MaxAmount`           | `AmountCur`   | `@AVAEMEAHackaton:MaxAmount`                | Yes       | Maximum cumulative Enasarco deduction  |
| `PctEnasarcoInvoice`  | `Percent`     | `@AVAEMEAHackaton:PctEnasarcoInv`           | Yes       | % applied to invoice amount            |
| `PctEnasarcoCompany`  | `Percent`     | `@AVAEMEAHackaton:PctEnasarcoCmp`           | Yes       | % applied to invoice amount (company)  |

**Indexes:**

| Index Name        | Fields               | Properties                          |
|-------------------|----------------------|-------------------------------------|
| `FromDateIdx`     | `FromDate`           | Primary Index = Yes, Clustered = Yes|

**Field groups:**

| Group Name   | Fields                                                                                             |
|--------------|----------------------------------------------------------------------------------------------------|
| `AutoReport` | `FromDate`, `ToDate`                                                                               |
| `General`    | `FromDate`, `ToDate`, `MinAmount`, `MaxAmount`, `PctEnasarcoInvoice`, `PctEnasarcoCompany`        |

**Table-level validation — `validateWrite()`:**  
Must verify that no other active record has an overlapping date range. If overlap detected, throw error using label `@AVAEMEAHackaton:ErrDateOverlap`.

**Static method `findByDate(TransDate _date)`:**
```xpp
/// <summary>
/// Finds the posting parameters record applicable for the given date.
/// </summary>
/// <param name="_date">The transaction date to look up.</param>
/// <returns>The matching AVAENASARCOPostingParameters record.</returns>
public static AVAENASARCOPostingParameters findByDate(TransDate _date)
{
    AVAENASARCOPostingParameters postingParams;

    select firstonly postingParams
        where postingParams.FromDate <= _date
           && (postingParams.ToDate >= _date
            || postingParams.ToDate == dateNull());

    return postingParams;
}
```

---

### 5.3 `AVAENASARCOTransHeader`

**Purpose:** Stores one record per vendor invoice posted for an ENASARCO-relevant vendor.

**Model:** EMEAHackaton  
**Table type:** Regular  
**Cache lookup:** None  
**Country Region Codes:** IT  
**Title Field 1:** `Supplier`  
**Title Field 2:** `Invoice`

| Field Name              | EDT / Type       | Label ID                                   | AllowEdit | AllowEditOnCreate | Notes                               |
|-------------------------|------------------|--------------------------------------------|-----------|-------------------|-------------------------------------|
| `Date`                  | `TransDate`      | `@SYS5765` (Date)                          | No        | No                | From `VendInvoiceJour.TransDate`    |
| `VoucherInvoice`        | `LedgerVoucher`  | `@AVAEMEAHackaton:VoucherInvoice`          | No        | No                | From `VendInvoiceJour.LedgerVoucher`|
| `Invoice`               | `VendInvoiceId`  | `@SYS7901` (Invoice)                       | No        | No                | From `VendInvoiceJour.InvoiceId`    |
| `Supplier`              | `VendAccount`    | `@SYS6455` (Vendor account)                | No        | No                | From `VendInvoiceJour.InvoiceAccount`|
| `InvoiceAmountOrigin`   | `AmountCur`      | `@AVAEMEAHackaton:InvoiceAmtOrigin`        | No        | No                | Sum of `VendInvoiceTrans.LineAmount`|
| `EnasarcoInvoiceTotal`  | `AmountCur`      | `@AVAEMEAHackaton:EnasarcoInvTotal`        | No        | No                | Calculated                          |
| `EnasarcoCompanyTotal`  | `AmountCur`      | `@AVAEMEAHackaton:EnasarcoCmpTotal`        | No        | No                | Calculated                          |
| `VoucherEnasarco`       | `LedgerVoucher`  | `@AVAEMEAHackaton:VoucherEnasarco`         | No        | No                | Empty on insert; set after journal posting |
| `VendInvoiceJourRecId`  | `RefRecId`       | `@SYS318804` (Record-ID)                   | No        | No                | FK to `VendInvoiceJour`             |

**Indexes:**

| Index Name               | Fields                              | Properties                          |
|--------------------------|-------------------------------------|-------------------------------------|
| `VendInvoiceJourRecIdIdx`| `VendInvoiceJourRecId`              | Unique = Yes, Primary Index = Yes   |
| `SupplierDateInvoiceIdx`  | `Supplier`, `Date`, `Invoice`       | Clustered = Yes                     |

**Relations:**

| Relation Name    | Related Table    | Field                  | Related Field | Validate | OnDelete    |
|------------------|------------------|------------------------|---------------|----------|-------------|
| `VendInvoiceJour`| `VendInvoiceJour`| `VendInvoiceJourRecId` | `RecId`       | Yes      | None        |
| `VendTable`      | `VendTable`      | `Supplier`             | `AccountNum`  | Yes      | None        |

**Field groups:**

| Group Name   | Fields                                                                                                      |
|--------------|-------------------------------------------------------------------------------------------------------------|
| `AutoReport` | `Supplier`, `Invoice`, `Date`                                                                               |
| `Overview`   | `Date`, `VoucherInvoice`, `Invoice`, `Supplier`, `InvoiceAmountOrigin`, `EnasarcoInvoiceTotal`, `EnasarcoCompanyTotal`, `VoucherEnasarco` |

---

### 5.4 `AVAENASARCOTransLines`

**Purpose:** Stores one record per vendor invoice journal line for ENASARCO-relevant invoices.

**Model:** EMEAHackaton  
**Table type:** Regular  
**Cache lookup:** None  
**Country Region Codes:** IT  
**Title Field 1:** `LineNumber`

| Field Name                   | EDT / Type        | Label ID                                    | AllowEdit | Notes                                  |
|------------------------------|-------------------|---------------------------------------------|-----------|----------------------------------------|
| `AVAENASARCOTransHeaderRecId`| `RefRecId`        | `@AVAEMEAHackaton:EnasarcoTransHdr`         | No        | FK to `AVAENASARCOTransHeader`         |
| `LineNumber`                 | `LineNum`         | `@SYS5349` (Line number)                    | No        | From `VendInvoiceTrans.LineNum`        |
| `ItemId`                     | `ItemId`          | `@SYS6578` (Item number)                    | No        |                                        |
| `ProcurementCategory`        | `PurchCategoryId` | `@SYS68119` (Procurement category)          | No        | From `VendInvoiceTrans.PurchCategory`  |
| `LineAmountOrigin`           | `LineAmount`      | `@AVAEMEAHackaton:InvoiceAmtOrigin`         | No        | From `VendInvoiceTrans.LineAmount`     |
| `EnasarcoInvoiceLine`        | `LineAmount`      | `@AVAEMEAHackaton:EnasarcoInvLine`          | No        | Calculated                             |
| `EnasarcoCompanyLine`        | `LineAmount`      | `@AVAEMEAHackaton:EnasarcoCmpLine`          | No        | Calculated                             |
| `VoucherEnasarco`            | `LedgerVoucher`   | `@AVAEMEAHackaton:VoucherEnasarco`          | No        | Empty on insert; updated after posting |
| `VendInvoiceRecId`           | `RefRecId`        | `@SYS318804` (Record-ID)                    | No        | FK to `VendInvoiceJour`               |
| `VendInvoiceTransRecId`      | `RefRecId`        | `@SYS318804` (Record-ID)                    | No        | FK to `VendInvoiceTrans`              |

**Indexes:**

| Index Name                   | Fields                          | Properties                          |
|------------------------------|---------------------------------|-------------------------------------|
| `VendInvoiceTransRecIdIdx`   | `VendInvoiceTransRecId`         | Unique = Yes, Primary Index = Yes   |
| `AVAENASARCOTransHeaderIdx`  | `AVAENASARCOTransHeaderRecId`   | Clustered = Yes                     |
| `VendInvoiceRecIdIdx`        | `VendInvoiceRecId`              |                                     |

**Relations:**

| Relation Name            | Related Table              | Field                          | Related Field  | Validate | OnDelete |
|--------------------------|----------------------------|--------------------------------|----------------|----------|----------|
| `AVAENASARCOTransHeader` | `AVAENASARCOTransHeader`   | `AVAENASARCOTransHeaderRecId`  | `RecId`        | Yes      | Cascade  |
| `VendInvoiceJour`        | `VendInvoiceJour`          | `VendInvoiceRecId`             | `RecId`        | Yes      | None     |
| `VendInvoiceTrans`       | `VendInvoiceTrans`         | `VendInvoiceTransRecId`        | `RecId`        | Yes      | None     |

**Field groups:**

| Group Name   | Fields                                                                                                                     |
|--------------|----------------------------------------------------------------------------------------------------------------------------|
| `AutoReport` | `LineNumber`, `ItemId`, `ProcurementCategory`                                                                              |
| `Overview`   | `LineNumber`, `ItemId`, `ProcurementCategory`, `LineAmountOrigin`, `EnasarcoInvoiceLine`, `EnasarcoCompanyLine`, `VoucherEnasarco` |

---

## 6. Table Extensions

### 6.1 `VendTable.AVAExtension`

**Purpose:** Adds the "Calculate Enasarco" flag to the vendor master.  
**Visible condition:** `CountryRegionId == 'IT'` (applied via form control `VisibleValue` expression or form data source event handler).

| Field Name         | EDT / Type | Label ID                              | Field Group     | Notes                       |
|--------------------|------------|---------------------------------------|-----------------|-----------------------------|
| `AVACalcEnasarco`  | `NoYes`    | `@AVAEMEAHackaton:CalcEnasarco`       | `AVAEnasarco`   | New field group `AVAEnasarco` added to extension |

**Field group added by extension:** `AVAEnasarco` containing `AVACalcEnasarco`.

---

### 6.2 `VendVendTableV2Entity.AVAExtension`

**Purpose:** Exposes `AVACalcEnasarco` for Data Management import/export.

The staging table `VendVendTableV2Staging` must also be extended:

**`VendVendTableV2Staging.AVAExtension`**

| Field Name         | EDT / Type | Notes                                  |
|--------------------|------------|----------------------------------------|
| `AVACalcEnasarco`  | `NoYes`    | Mirror of the VendTable extension field|

---

### 6.3 `LedgerJournalTrans.AVAExtension`

**Purpose:** Stores a reference from the General Ledger journal line back to the ENASARCO transaction line for traceability.

| Field Name                   | EDT / Type | Label ID                            | Notes                              |
|------------------------------|------------|-------------------------------------|------------------------------------|
| `AVAENASARCOTransLinesRecId` | `RefRecId` | `@AVAEMEAHackaton:EnasarcoTransLines`| FK to `AVAENASARCOTransLines.RecId`|

---

## 7. Data Entities

### 7.1 `AVAENASARCOTransEntity` (New)

**Purpose:** Export/import of ENASARCO header and lines for reporting and integration.  
**Entity category:** Transaction  
**IsPublic:** Yes  
**Data management enabled:** Yes

**Root data source:** `AVAENASARCOTransHeader`  
**Child data source:** `AVAENASARCOTransLines` (joined via `AVAENASARCOTransHeaderRecId`)

**Exposed fields:**

| Entity Field Name           | Source Table               | Source Field              |
|-----------------------------|----------------------------|---------------------------|
| `Date`                      | `AVAENASARCOTransHeader`   | `Date`                    |
| `VoucherInvoice`            | `AVAENASARCOTransHeader`   | `VoucherInvoice`          |
| `Invoice`                   | `AVAENASARCOTransHeader`   | `Invoice`                 |
| `Supplier`                  | `AVAENASARCOTransHeader`   | `Supplier`                |
| `InvoiceAmountOrigin`       | `AVAENASARCOTransHeader`   | `InvoiceAmountOrigin`     |
| `EnasarcoInvoiceTotal`      | `AVAENASARCOTransHeader`   | `EnasarcoInvoiceTotal`    |
| `EnasarcoCompanyTotal`      | `AVAENASARCOTransHeader`   | `EnasarcoCompanyTotal`    |
| `VoucherEnasarco`           | `AVAENASARCOTransHeader`   | `VoucherEnasarco`         |
| `VendInvoiceJourRecId`      | `AVAENASARCOTransHeader`   | `VendInvoiceJourRecId`    |
| `LineNumber`                | `AVAENASARCOTransLines`    | `LineNumber`              |
| `ItemId`                    | `AVAENASARCOTransLines`    | `ItemId`                  |
| `ProcurementCategory`       | `AVAENASARCOTransLines`    | `ProcurementCategory`     |
| `LineAmountOrigin`          | `AVAENASARCOTransLines`    | `LineAmountOrigin`        |
| `EnasarcoInvoiceLine`       | `AVAENASARCOTransLines`    | `EnasarcoInvoiceLine`     |
| `EnasarcoCompanyLine`       | `AVAENASARCOTransLines`    | `EnasarcoCompanyLine`     |
| `LineVoucherEnasarco`       | `AVAENASARCOTransLines`    | `VoucherEnasarco`         |

**Entity key fields:** `Date`, `Invoice`, `Supplier`, `LineNumber`

---

### 7.2 `AVAENASARCOParametersEntity` (New)

**Purpose:** Enables Data Management export/import of ENASARCO parameters.  
**Entity category:** Parameters  
**Root data source:** `AVAENASARCOParameters`

---

### 7.3 `AVAENASARCOPostingParametersEntity` (New)

**Purpose:** Enables Data Management export/import of posting parameters (rates and caps).  
**Entity category:** Reference  
**Root data source:** `AVAENASARCOPostingParameters`

---

## 8. Forms

### 8.1 `AVAENASARCOParameters`

**Pattern:** Simple details — Part 1 (matches Accounts Payable parameters pattern)  
**Data source:** `AVAENASARCOParameters`  
**Default action:** `AVAENASARCOParameters.find(true)` on `init()`.

**Form layout:**

```
TabPage: General
  Group: Enasarco
    EnasarcoEnabled
  Group: Accounts
    CompanyCostAccount
    LiabilityAccount
  Group: Journal
    JournalName
    JournalDescription
    PostJournal
```

**Special behaviour:** On `EnasarcoEnabled = No`, the other fields should be disabled (use `modifiedField` on the data source).

---

### 8.2 `AVAENASARCOPostingParameters`

**Pattern:** Simple list  
**Data source:** `AVAENASARCOPostingParameters`  
**CRUD:** Create, Update, Delete — Yes

**Grid columns:** `FromDate`, `ToDate`, `MinAmount`, `MaxAmount`, `PctEnasarcoInvoice`, `PctEnasarcoCompany`

**Validation on save:** Call table `validateWrite()` which checks for date-range overlap.

---

### 8.3 `AVAENASARCOTransHeader`

**Pattern:** Simple list  
**Data source:** `AVAENASARCOTransHeader`  
**CRUD:** Read-only (no Create/Update/Delete buttons)

**Grid columns:** `Date`, `VoucherInvoice`, `Invoice`, `Supplier`, `InvoiceAmountOrigin`, `EnasarcoInvoiceTotal`, `EnasarcoCompanyTotal`, `VoucherEnasarco`

**Button:** "Lines" — navigates to `AVAENASARCOTransLines` filtered by the selected header `RecId`.

---

### 8.4 `AVAENASARCOTransLines`

**Pattern:** Simple list  
**Data sources:** `AVAENASARCOTransLines` (main), `AVAENASARCOTransHeader` (joined, read-only lookup)  
**CRUD:** Read-only

**Grid columns:** `Date` (from header), `VoucherInvoice` (from header), `Invoice` (from header), `Supplier` (from header), `LineNumber`, `ItemId`, `ProcurementCategory`, `LineAmountOrigin`, `EnasarcoInvoiceLine`, `EnasarcoCompanyLine`, `VoucherEnasarco`

---

## 9. Menu Items & Menu Extensions

### 9.1 New Display Menu Items

| Menu Item Name                        | Object                          | Label ID                                    |
|---------------------------------------|---------------------------------|---------------------------------------------|
| `AVAENASARCOParameters`               | Form `AVAENASARCOParameters`    | `@AVAEMEAHackaton:EnasarcoParams`           |
| `AVAENASARCOPostingParameters`        | Form `AVAENASARCOPostingParameters` | `@AVAEMEAHackaton:EnasarcoPostParams`   |
| `AVAENASARCOTransHeader`              | Form `AVAENASARCOTransHeader`   | `@AVAEMEAHackaton:EnasarcoTransHdr`         |
| `AVAENASARCOTransLines`               | Form `AVAENASARCOTransLines`    | `@AVAEMEAHackaton:EnasarcoTransLines`       |

### 9.2 New Action Menu Item

| Menu Item Name              | Object (Class)                      | Label ID                               | Runs on      |
|-----------------------------|-------------------------------------|----------------------------------------|--------------|
| `AVAENASARCOJournal`        | `AVAENASARCOJournalController`      | `@AVAEMEAHackaton:PostEnasarco`        | Called from Server |

### 9.3 Menu Extensions

**`Tax.AVAExtension`** — Adds a new menu group and items:

```
Tax
└── Setup
│   └── AVAEnasarco (new group, label: @AVAEMEAHackaton:EnasarcoGroup)
│       ├── AVAENASARCOParameters        (Display)
│       └── AVAENASARCOPostingParameters (Display)
└── Inquiries and Reports
│   └── AVAEnasarco (new group, label: @AVAEMEAHackaton:EnasarcoGroup)
│       ├── AVAENASARCOTransHeader       (Display)
│       └── AVAENASARCOTransLines        (Display)
└── Periodic tasks
    └── AVAENASARCOJournal               (Action)
```

---

## 10. Security

### 10.1 Privileges

| Privilege Name                            | Object                              | Access Level | Label                                       |
|-------------------------------------------|-------------------------------------|--------------|---------------------------------------------|
| `AVAENASARCOParametersMaintain`           | `AVAENASARCOParameters` (MI)        | Update       | `@AVAEMEAHackaton:EnasarcoParams`           |
| `AVAENASARCOPostingParametersMaintain`    | `AVAENASARCOPostingParameters` (MI) | Update       | `@AVAEMEAHackaton:EnasarcoPostParams`       |
| `AVAENASARCOTransHeaderView`              | `AVAENASARCOTransHeader` (MI)       | Read         | `@AVAEMEAHackaton:EnasarcoTransHdr`         |
| `AVAENASARCOTransLinesView`               | `AVAENASARCOTransLines` (MI)        | Read         | `@AVAEMEAHackaton:EnasarcoTransLines`       |
| `AVAENASARCOJournalMaintain`              | `AVAENASARCOJournal` (Action MI)    | Invoke       | `@AVAEMEAHackaton:PostEnasarco`             |

### 10.2 Duties

| Duty Name                              | Privileges Included                                                                                      |
|----------------------------------------|----------------------------------------------------------------------------------------------------------|
| `AVAENASARCOSetupMaintain`             | `AVAENASARCOParametersMaintain`, `AVAENASARCOPostingParametersMaintain`                                  |
| `AVAENASARCOTransactionsView`          | `AVAENASARCOTransHeaderView`, `AVAENASARCOTransLinesView`                                                |
| `AVAENASARCOJournalPost`               | `AVAENASARCOJournalMaintain`, `AVAENASARCOTransactionsView`                                              |

### 10.3 Roles

Assign duties to existing standard roles:

| Standard Role              | Duties Assigned                                                   |
|----------------------------|-------------------------------------------------------------------|
| `AccountsPayablePaymentsClerk` | `AVAENASARCOTransactionsView`                                 |
| `AccountantSupervisor`     | `AVAENASARCOSetupMaintain`, `AVAENASARCOJournalPost`              |

---

## 11. Business Logic Classes

### 11.1 `AVAENASARCOTransCreator`

**Purpose:** Contains all business logic for creating `AVAENASARCOTransHeader` and `AVAENASARCOTransLines` records after a vendor invoice is posted. Called from the CoC extension (see §14).

**Type:** Regular class (server-side)

**Key methods:**

```xpp
/// <summary>
/// Entry point: creates the ENASARCO header and lines for a given posted invoice.
/// </summary>
/// <param name="_vendInvoiceJour">The posted vendor invoice journal record.</param>
public void createFromInvoice(VendInvoiceJour _vendInvoiceJour)
```

```xpp
/// <summary>
/// Creates the ENASARCO transaction header record.
/// </summary>
/// <param name="_vendInvoiceJour">The posted vendor invoice journal record.</param>
/// <returns>The created AVAENASARCOTransHeader record.</returns>
protected AVAENASARCOTransHeader createHeader(VendInvoiceJour _vendInvoiceJour)
```

```xpp
/// <summary>
/// Creates ENASARCO transaction line records for each vendor invoice transaction line.
/// </summary>
/// <param name="_header">The ENASARCO header record.</param>
/// <param name="_vendInvoiceJour">The vendor invoice journal record.</param>
protected void createLines(
    AVAENASARCOTransHeader  _header,
    VendInvoiceJour         _vendInvoiceJour)
```

```xpp
/// <summary>
/// Calculates the ENASARCO deduction amount for a given line or header,
/// applying the minimum/maximum cap logic.
/// </summary>
/// <param name="_lineAmount">The original invoice line or total amount.</param>
/// <param name="_postingParams">The applicable posting parameters record.</param>
/// <param name="_sumAlreadyPosted">Sum of already posted Enasarco amounts in the period.</param>
/// <param name="_pctField">The percentage to use (invoice or company).</param>
/// <returns>The calculated capped amount.</returns>
protected AmountCur calculateEnasarcoAmount(
    AmountCur                       _lineAmount,
    AVAENASARCOPostingParameters    _postingParams,
    AmountCur                       _sumAlreadyPosted,
    Percent                         _pct)
```

---

### 11.2 `AVAENASARCOJournalCreator`

**Purpose:** Creates the General Ledger journal with debit/credit lines for all pending ENASARCO transactions (where `VoucherEnasarco` is blank). Called from the SysOperation service class.

**Key methods:**

```xpp
/// <summary>
/// Creates the ENASARCO general ledger journal and its lines for all
/// unprocessed ENASARCO transactions in the current company.
/// </summary>
/// <returns>The journal number of the created (and optionally posted) journal.</returns>
public LedgerJournalId run()
```

```xpp
/// <summary>
/// Creates the journal header using parameters from AVAENASARCOParameters.
/// </summary>
/// <returns>The created LedgerJournalTable record.</returns>
protected LedgerJournalTable createJournalHeader()
```

```xpp
/// <summary>
/// Creates journal lines for a single ENASARCO transaction line.
/// Three lines per transaction: vendor (debit), company expense (debit), payment (credit).
/// </summary>
/// <param name="_journalTable">The journal header.</param>
/// <param name="_transLine">The ENASARCO transaction line record.</param>
protected void createJournalLines(
    LedgerJournalTable          _journalTable,
    AVAENASARCOTransLines       _transLine)
```

```xpp
/// <summary>
/// Updates the VoucherEnasarco field on the header and lines after journal posting.
/// </summary>
/// <param name="_journalTable">The posted journal.</param>
protected void updateVoucherOnTransactions(LedgerJournalTable _journalTable)
```

---

## 12. Periodic Job — SysOperation Framework

The periodic job "Post ENASARCO transactions" (`General Ledger > Periodic tasks > Post ENASARCO transactions`) is implemented using the **SysOperation Framework** (not RunBase).

### 12.1 `AVAENASARCOJournalContract`

**Type:** Data contract class  
**Implements:** `SysOperationValidatable`

```xpp
[DataContractAttribute]
public class AVAENASARCOJournalContract implements SysOperationValidatable
{
    // No additional parameters required for V1.
    // Future extension point: date filter for selective processing.

    public boolean validate()
    {
        AVAENASARCOParameters parameters = AVAENASARCOParameters::find();

        if (!parameters.EnasarcoEnabled)
        {
            return checkFailed("@AVAEMEAHackaton:ErrEnasarcoDisabled");
        }

        return true;
    }
}
```

---

### 12.2 `AVAENASARCOJournalService`

**Type:** SysOperation service class

```xpp
/// <summary>
/// Service class for the ENASARCO journal creation periodic process.
/// Implements the SysOperation framework service pattern.
/// </summary>
class AVAENASARCOJournalService extends SysOperationServiceBase
{
    /// <summary>
    /// Main execution method. Creates the ENASARCO GL journal for all pending transactions.
    /// </summary>
    /// <param name="_contract">The data contract for this operation.</param>
    [SysEntryPointAttribute(true)]
    public void run(AVAENASARCOJournalContract _contract)
    {
        AVAENASARCOJournalCreator creator = new AVAENASARCOJournalCreator();
        LedgerJournalId           journalId;

        ttsbegin;
        journalId = creator.run();
        ttscommit;

        if (journalId)
        {
            info(strFmt("@AVAEMEAHackaton:InfoJournalCreated", journalId));
        }
    }
}
```

---

### 12.3 `AVAENASARCOJournalController`

**Type:** SysOperation controller class

```xpp
/// <summary>
/// Controller for the ENASARCO journal creation process.
/// Provides batch scheduling support via SysOperation framework.
/// </summary>
class AVAENASARCOJournalController extends SysOperationServiceController
{
    public static AVAENASARCOJournalController construct()
    {
        return new AVAENASARCOJournalController(
            classStr(AVAENASARCOJournalService),
            methodStr(AVAENASARCOJournalService, run),
            SysOperationExecutionMode::Synchronous);
    }

    public static void main(Args _args)
    {
        AVAENASARCOJournalController controller = AVAENASARCOJournalController::construct();

        controller.parmShowDialog(true);
        controller.startOperation();
    }

    public LabelType parmDialogCaption(LabelType _caption = '')
    {
        return "@AVAEMEAHackaton:PostEnasarco";
    }
}
```

> **Batch support:** Because the controller extends `SysOperationServiceController`, the user can schedule execution as a recurrent batch job from the dialog. Multi-threading must be assessed against data volume; for V1 it is single-threaded.

---

## 13. Business Event

### 13.1 `AVAENASARCOJournalPostedBusinessEvent`

**Purpose:** Fires when an ENASARCO journal is posted, allowing Azure Logic Apps to consume the ENASARCO transaction data.

**Base class:** `BusinessEventsBase`  
**Trigger condition:** `LedgerJournalTable.JournalName == AVAENASARCOParameters.JournalName` (checked in the CoC extension on `LedgerJournalTable` or the posting class; see §14.3).

**Contract class:** `AVAENASARCOJournalPostedContract`

Fields exposed in the contract:

**From `AVAENASARCOTransHeader`:**
- `Date`
- `VoucherInvoice`
- `Invoice`
- `Supplier`
- `InvoiceAmountOrigin`
- `EnasarcoInvoiceTotal`
- `EnasarcoCompanyTotal`
- `VoucherEnasarco`
- `VendInvoiceJourRecId`

**From `AVAENASARCOTransLines` (collection, child to header):**
- `LineNumber`
- `ItemId`
- `ProcurementCategory`
- `LineAmountOrigin`
- `EnasarcoInvoiceLine`
- `EnasarcoCompanyLine`
- `VoucherEnasarco`

```xpp
/// <summary>
/// Business event raised when an ENASARCO General Ledger journal is posted.
/// Enables integration with Azure Integration Services.
/// </summary>
[BusinessEvents(
    classStr(AVAENASARCOJournalPostedContract),
    "@AVAEMEAHackaton:EnasarcoJournPosted",
    "@AVAEMEAHackaton:EnasarcoJournPosted",
    ModuleAxapta::Ledger)]
public class AVAENASARCOJournalPostedBusinessEvent extends BusinessEventsBase
{
    private LedgerJournalTable  ledgerJournalTable;

    public static AVAENASARCOJournalPostedBusinessEvent newFromJournal(
        LedgerJournalTable _ledgerJournalTable)
    {
        var event = new AVAENASARCOJournalPostedBusinessEvent();
        event.ledgerJournalTable = _ledgerJournalTable;
        return event;
    }

    [Wrappable(false), Replaceable(false)]
    public BusinessEventsContract buildContract()
    {
        return AVAENASARCOJournalPostedContract::newFromJournal(this.ledgerJournalTable);
    }
}
```

---

## 14. CoC Extensions on Standard Objects

### 14.1 `AVAVendInvoiceJourDbt_Extension`

**Extended object:** `VendInvoiceJour` (table — via CoC on `insert`)  
**Naming convention:** `AVA` + `VendInvoiceJour` + `Dbt` + `_Extension`

**Purpose:** After a `VendInvoiceJour` record is inserted (as part of vendor invoice posting), create the corresponding ENASARCO header and lines when conditions are met.

```xpp
[ExtensionOf(tableStr(VendInvoiceJour))]
final class AVAVendInvoiceJourDbt_Extension
{
    /// <summary>
    /// CoC on insert: triggers ENASARCO transaction creation after invoice journal insertion.
    /// </summary>
    public void insert()
    {
        next insert();
        this.avaCreateEnasarcoTransactions();
    }

    /// <summary>
    /// Creates ENASARCO transactions if the vendor and company qualify.
    /// </summary>
    private void avaCreateEnasarcoTransactions()
    {
        AVAENASARCOParameters parameters = AVAENASARCOParameters::find();

        if (!parameters.EnasarcoEnabled)
        {
            return;
        }

        VendTable vendTable = VendTable::find(this.InvoiceAccount);

        if (!vendTable.AVACalcEnasarco)
        {
            return;
        }

        AVAENASARCOTransCreator creator = new AVAENASARCOTransCreator();
        creator.createFromInvoice(this);
    }
}
```

---

### 14.2 `AVAVendTableFrm_Extension` (Form extension)

**Extended object:** `VendTable` (form)  
**Naming:** `VendTable.AVAExtension` (metadata extension for field group and control visibility)

**Purpose:** Add the `AVACalcEnasarco` field to the "Invoice and Delivery" tab inside a new `AVAEnasarco` field group. Control is visible only when `CompanyInfo.CountryRegionId == 'IT'`.

Implementation: Use a form extension to add the control and apply a `VisibleValue` binding or an `init()` CoC to set visibility.

---

### 14.3 `AVALedgerJournalTableDbt_Extension`

**Extended object:** `LedgerJournalTable` (table — via CoC on `postingUpdate` or the posting event)  
**Naming:** `AVALedgerJournalTableDbt_Extension`

**Purpose:** Fires the `AVAENASARCOJournalPostedBusinessEvent` when an ENASARCO journal is posted.

```xpp
[ExtensionOf(tableStr(LedgerJournalTable))]
final class AVALedgerJournalTableDbt_Extension
{
    /// <summary>
    /// CoC on update: fires the ENASARCO business event when the journal is posted
    /// and belongs to the ENASARCO journal name.
    /// </summary>
    public void update()
    {
        next update();
        this.avaFireEnasarcoBusinessEvent();
    }

    private void avaFireEnasarcoBusinessEvent()
    {
        AVAENASARCOParameters parameters = AVAENASARCOParameters::find();

        if (this.Posted
            && this.JournalName == parameters.JournalName
            && parameters.JournalName != '')
        {
            AVAENASARCOJournalPostedBusinessEvent
                ::newFromJournal(this)
                .send();
        }
    }
}
```

---

## 15. Key Algorithms

### 15.1 ENASARCO Amount Calculation (Cap Logic)

Applies identically for invoice % and company % fields, at both header and line level.

```
INPUT:
  lineAmount         — invoice amount for this header / line
  pct                — percentage from AVAENASARCOPostingParameters (invoice or company)
  postingParams      — AVAENASARCOPostingParameters record for the transaction date
  sumAlreadyPosted   — sum of all existing Enasarco amounts (invoice or company)
                       for the same supplier within [postingParams.FromDate .. postingParams.ToDate]
                       (excluding the current record being inserted)

STEP 1: calculatedAmount = lineAmount * (pct / 100)

STEP 2: if sumAlreadyPosted >= postingParams.MaxAmount
            return 0

STEP 3: if (sumAlreadyPosted + calculatedAmount) > postingParams.MaxAmount
            return postingParams.MaxAmount - sumAlreadyPosted

STEP 4: return calculatedAmount
```

> **Note:** The `sumAlreadyPosted` query must filter `AVAENASARCOTransHeader` (or `AVAENASARCOTransLines`) for the same `Supplier`, within the date range defined by the found `AVAENASARCOPostingParameters` record (i.e. `MinDate <= Date <= MaxDate`), and **exclude** the current record being inserted to avoid double-counting.

### 15.2 ENASARCO Company Amount — Short-Circuit

Before calculating the company amount, check if the invoice amount is 0:
- If `EnasarcoInvoiceLine == 0` (or `EnasarcoInvoiceTotal == 0`) → set `EnasarcoCompanyLine = 0` (or `EnasarcoCompanyTotal = 0`) immediately; do not run the cap algorithm.

### 15.3 Journal Line Structure per ENASARCO Transaction Line

For each `AVAENASARCOTransLines` record where `VoucherEnasarco` is blank:

| # | Journal line type | Account                                  | Debit                    | Credit                               |
|---|-------------------|------------------------------------------|--------------------------|--------------------------------------|
| 1 | Vendor            | `AVAENASARCOTransHeader.Supplier`        | `EnasarcoInvoiceLine`    | —                                    |
| 2 | Ledger            | `AVAENASARCOParameters.CompanyCostAccount`| `EnasarcoCompanyLine`   | —                                    |
| 3 | Ledger            | `AVAENASARCOParameters.LiabilityAccount` | —                        | `EnasarcoInvoiceLine + EnasarcoCompanyLine` |

Line 1 must also replicate the "Settlement" function linking to the originating vendor invoice (`VendInvoiceRecId`).  
After the journal is posted, `LedgerJournalTrans.AVAENASARCOTransLinesRecId` is set to `AVAENASARCOTransLines.RecId` for each line.

---

## 16. Testing Considerations

### 16.1 Happy Path

1. Set `AVAENASARCOParameters.EnasarcoEnabled = Yes` for the Italian entity.
2. Configure at least one `AVAENASARCOPostingParameters` record (valid date range, rates, caps).
3. Mark a vendor with `AVACalcEnasarco = Yes`.
4. Post a vendor invoice for this vendor.
5. **Expected:** `AVAENASARCOTransHeader` and `AVAENASARCOTransLines` records created; `VoucherEnasarco` is blank.
6. Run "Post ENASARCO transactions" from `General Ledger > Periodic tasks`.
7. **Expected:** GL journal created with correct debit/credit lines; `VoucherEnasarco` populated on header and lines; business event fired.

### 16.2 Maximum Cap Scenario

1. Post multiple invoices for the same vendor so that the cumulative ENASARCO deduction reaches the maximum cap.
2. Post one more invoice.
3. **Expected:** The ENASARCO amounts for the last invoice are capped (partial or zero).

### 16.3 Disabled Vendor Scenario

1. Post a vendor invoice for a vendor with `AVACalcEnasarco = No`.
2. **Expected:** No `AVAENASARCOTransHeader` record created.

### 16.4 Enasarco Disabled Company Scenario

1. Set `AVAENASARCOParameters.EnasarcoEnabled = No`.
2. Post any vendor invoice (even ENASARCO vendor).
3. **Expected:** No ENASARCO records created.

### 16.5 Date Range Overlap Validation

1. Create two `AVAENASARCOPostingParameters` records with overlapping date ranges.
2. **Expected:** Validation error with `@AVAEMEAHackaton:ErrDateOverlap` on save.

### 16.6 No Posting Parameters Found

1. Post a vendor invoice on a date not covered by any `AVAENASARCOPostingParameters` record.
2. **Expected:** Error thrown with `@AVAEMEAHackaton:ErrNoPostingParam` containing the transaction date.

### 16.7 Data Entity Import/Export

1. Export `AVAENASARCOTransEntity` via Data Management.
2. Verify all header and line fields are present.
3. Test the `VendVendTableV2Entity` export/import including `AVACalcEnasarco`.

### 16.8 Non-IT Company

1. Switch to a non-Italian legal entity.
2. Verify that ENASARCO controls on `VendTable` form are hidden and no ENASARCO logic runs.

---

*End of TDD — EMEAHackaton ENASARCO Process*
