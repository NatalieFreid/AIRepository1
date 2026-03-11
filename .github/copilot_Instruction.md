# Copilot Instruction: D365FO X++ Development

## Step 1 — TDD Splitting

When the user requests to create X++ code for a TDD, first split the TDD following
the instructions defined in **TDD_Split_Instruction.md**.

Do not use any previous context from the chat. Process only the information
provided in the current TDD.

---

## Step 2 — X++ Code Generation

After Step 1 is complete, ask the user:

> **"Would you like to process all split TDDs at once, or one by one?"**

**If one by one:**
- Process the first TDD in the sequence.
- After each TDD is complete, ask the user:
  > **"Ready to proceed to the next TDD: [ObjectType] — [ObjectName]?"**
- Wait for confirmation before processing the next TDD.

**If all at once:**
- Process all TDDs in the sequence without interruption.

For every X++ object regardless of mode:
- Create the **XML AOT file** for the model specified in the TDD.
- If a label file for the model and languages specified in the TDD does not yet
  exist, ask the user to create it before generating any code that references labels.
- Do not add any information beyond what is defined in the TDD.
