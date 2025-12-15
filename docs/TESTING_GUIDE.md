# Quick Testing Guide - Recycling Analysis System

## Backend Testing

### Start Backend

```bash
cd apps/backend
pnpm start:dev
```

### GraphQL Playground

Open: http://localhost:3000/graphql

### Test Mutations

#### Example 1: Plastic Bottle (Berlin)

```graphql
mutation {
  finalizeRecycling(
    input: { objectName: "Plastic Bottle", materials: ["plastic"], city: "Berlin" }
  ) {
    objectName
    materials
    recycling {
      objectName
      bin
      rules
      cityOverride
    }
    instructions
  }
}
```

**Expected:** Gelber Sack with Berlin-specific orange bin note

#### Example 2: Greasy Pizza Box

```graphql
mutation {
  finalizeRecycling(input: { objectName: "Greasy Pizza Box", materials: ["paper", "cardboard"] }) {
    recycling {
      bin
      rules
    }
  }
}
```

**Expected:** Restmüll (exception handling for greasy paper)

#### Example 3: Glass Jar (Munich)

```graphql
mutation {
  finalizeRecycling(input: { objectName: "Glass Jar", materials: ["glass"], city: "Munich" }) {
    recycling {
      bin
      cityOverride
    }
  }
}
```

**Expected:** Glas with Munich strict separation note

#### Example 4: Electronics

```graphql
mutation {
  finalizeRecycling(input: { objectName: "Old Phone", materials: ["electronic", "battery"] }) {
    recycling {
      bin
      rules
    }
  }
}
```

**Expected:** Elektroschrott with collection point instructions

## Mobile Testing

### Start Mobile App

```bash
cd apps/mobile
pnpm start
```

### Test Flow

1. **Navigate to Identify Tab**
   - Bottom navigation → Camera icon

2. **Take/Select Photo**
   - Use camera button OR
   - Use gallery button
   - App will auto-classify (prototype heuristic)

3. **View Results Overlay**
   - Classification label
   - Confidence percentage
   - Quick actions (Close, Re-run, Details)

4. **Open Detail Page**
   - Tap "Details" button
   - Shows full image + local rules

5. **Get Backend Analysis**
   - Tap "Get Analysis" button
   - Backend mutation called
   - Shows German bin assignment
   - Displays LLM-generated instructions

### Expected Behavior

**Prototype Classification:**

- Image with "plastic" in name → Plastic (85%)
- Image with "paper" in name → Paper (82%)
- Image with "glass" in name → Glass (80%)
- Other → Unknown (40%)

**Backend Analysis:**

- Green text showing German bin
- City-specific notes (if applicable)
- Formatted instructions from LLM service

## Common Test Cases

### 1. Recyclable Plastic

- **Object:** "Yogurt Container"
- **Materials:** ["plastic"]
- **Expected Bin:** Gelber Sack
- **Key Rule:** Rinse before disposal

### 2. Contaminated Paper

- **Object:** "Greasy Napkin"
- **Materials:** ["paper"]
- **Expected Bin:** Restmüll (exception)
- **Reason:** Food contamination

### 3. Mixed Materials

- **Object:** "Unknown Item"
- **Materials:** ["mixed"]
- **Expected Bin:** Restmüll (fallback)
- **Guidance:** Check for separation

### 4. Organic Waste

- **Object:** "Apple Core"
- **Materials:** ["organic", "food"]
- **Expected Bin:** Biomüll
- **Note:** Hamburg city-wide collection

## Debugging

### Backend Logs

```bash
# Watch backend console for:
[RecyclingService] Finalizing recycling for: <object>
[LlmService] Generated instructions for <object>
```

### Mobile Logs

```bash
# Metro bundler shows:
- GraphQL request/response
- Classification results
- Navigation events
```

### Common Issues

**Issue:** Backend mutation not found

- **Fix:** Ensure backend is running and schema regenerated
- **Check:** `schema.gql` contains `finalizeRecycling`

**Issue:** Mobile codegen errors

- **Fix:** Start backend first, then run `pnpm codegen`
- **Check:** `apps/mobile/src/__generated__/` updated

**Issue:** Classification not triggering

- **Fix:** Ensure TensorFlow initialized (`ready` state)
- **Check:** Console for "Initializing TensorFlow..."

## Performance Checks

### Backend Response Time

- Target: < 500ms for mutation
- Monitor: GraphQL Playground network tab

### Mobile Classification

- Prototype: Instant (heuristic)
- Backend call: 300-800ms (depends on network)

### Network Efficiency

- Mutation size: ~2-5KB request
- Response size: ~3-8KB (with instructions)

## Next Steps After Testing

1. **Verify GraphQL Schema**
   - Check `apps/backend/schema.gql` for types
   - Confirm `FinalizeRecyclingInput` and `FinalRecyclingResult`

2. **Test City Variants**
   - Berlin, Munich, Hamburg
   - Verify city-specific rules appear

3. **Test Edge Cases**
   - Empty materials array
   - Unknown object names
   - Missing city parameter

4. **Performance Test**
   - Multiple rapid classifications
   - Network offline handling
   - Backend timeout scenarios

---

**Happy Testing!** 🧪♻️
