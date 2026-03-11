# Copilot Instruction: D365FO X++ Development

## Step 1 — TDD Splitting

When the user requests to create X++ code for a TDD, first split the TDD following
the instructions defined in **TDD_Split_Instruction.md**.

Do not use any previous context from the chat. Process only the information
provided in the current TDD.

---

## Step 2 — X++ Code Generation

For each individual TDD produced in Step 1, generate the X++ code in the
processing sequence defined in Step 1.

For every X++ object:
- Create the **XML AOT file** for the model specified in the TDD.
- If a label file for the model and languages specified in the TDD does not yet
  exist, ask the user to create it before generating any code that references labels.
- Do not add any information beyond what is defined in the TDD.
