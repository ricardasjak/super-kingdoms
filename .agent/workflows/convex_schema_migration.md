---
description: How to safely add new fields to the Convex database schema
---

# Convex Schema Migration Guide

When adding a new REQUIRED field to an existing Convex table in `convex/schema.ts`, you MUST follow this migration pattern to prevent schema validation errors on existing database documents:

1. **Deploy Optional Schema First**: 
   Add the new field to `convex/schema.ts` but wrap it in `v.optional(...)`.
   Example: `newField: v.optional(v.number())`

// turbo
2. **Push the Schema**:
   Deploy the optional schema to the dev environment so the backend accepts both old and new data shapes:
   `npx convex dev --once`

3. **Write a Migration Script**:
   In `convex/migrations.ts`, write a mutation script that collects all records from the table, checks if the field is `undefined`, and patches it with a default value.
   Example:
   ```typescript
   export const runMyMigration = mutation({
     args: {},
     handler: async (ctx) => {
       const records = await ctx.db.query("myTable").collect();
       let count = 0;
       for (const record of records) {
         if (record.newField === undefined) {
           await ctx.db.patch(record._id, { newField: 0 }); // Default value
           count++;
         }
       }
       return `Migrated ${count} records`;
     }
   });
   ```

// turbo
4. **Run the Migration**:
   Execute the migration script to backfill existing data:
   `npx convex run migrations:runMyMigration`

5. **Enforce Strict Schema**:
   Go back to `convex/schema.ts` and remove the `v.optional(...)` wrapper so the field is strictly required going forward.
   Example: `newField: v.number()`

// turbo
6. **Finalize Deployment**:
   Push the strict schema to Convex. Because all records were patched in step 4, this strict validation will now pass:
   `npx convex dev --once`
