
---
mode: ask
title: "D365FO: Generate new AxClass XML from reference"
description: "Create a new class metadata XML by mirroring an example in Project/Metadata_Examples/Classes/"
---

You are generating a **Dynamics 365 F&O (D365FO) class metadata XML**.

**Goal**
Produce a new `AxClass` XML, matching the **structure, element order, indentation (2 spaces), and attribute naming** of the reference file.

**Inputs I will provide next**
- `reference`: path to the example (e.g., `Project/Metadata_Examples/Classes/ExampleClass.xml`)
- `targetName`: class name to generate (e.g., `CustomerSync`)
- `properties`: list of `<Property Name="..." Value="..."/>` pairs (e.g., `RunOn=Server`, `Label=@Example:Customer sync`)
- `source`: X++ class body (CDATA) to embed

**Rules**
- **Keep element order** identical to the reference: `<AxClass>` → `<Properties>` → `<SourceCode><![CDATA[...]]></SourceCode>`
- Copy the **attribute style and casing** exactly.
- Output **only valid XML** (UTF‑8, include XML declaration). No comments/markdown.
- Do not invent properties or methods unless explicitly listed.

**Example follow-up I will send**
``
