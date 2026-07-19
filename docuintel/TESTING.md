# DocuIntel — Testing Guide

## Test Suite Overview

DocuIntel includes comprehensive testing to ensure reliability and quality.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run full verification (type-check + lint + test + build)
pnpm verify
```

## Test Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts          # Core utility function tests
│   │   └── test-utils.ts          # Test helpers and mock generators
│   └── ai/
│       └── __tests__/
│           └── mock.test.ts       # AI adapter integration tests
```

## Test Coverage

### Current Coverage Areas

#### ✅ Core Utilities (`utils.test.ts`)
- **Risk Score Calculation**: Validates severity-weighted scoring algorithm
- **Color Utilities**: Tests risk score and severity color mapping
- **Format Utilities**: File size, date formatting, text truncation
- **Text Offset Finding**: Document text location for highlights

#### ✅ AI Mock Adapter (`mock.test.ts`)
- **Document Extraction**: Structure parsing and section detection
- **Risk Analysis**: Finding detection for various risk categories
- **Summary Generation**: Executive summary synthesis
- **Stream Processing**: Async summary streaming

#### ✅ Test Utilities (`test-utils.ts`)
- Mock data generators for findings, documents, analyses
- Helper functions for testing async operations
- Assertion utilities for type checking

## Writing New Tests

### Example Test Structure

```typescript
import { describe, test, expect } from '@jest/globals';
import { functionToTest } from '../module';

describe('Feature Name', () => {
  test('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });

  test('should handle edge cases', () => {
    expect(functionToTest(edgeCase)).toBeDefined();
  });
});
```

### Using Mock Data Generators

```typescript
import { generateMockFinding, generateMockAnalysis } from '@/lib/__tests__/test-utils';

test('processes findings correctly', () => {
  const finding = generateMockFinding({ severity: 'critical' });
  const analysis = generateMockAnalysis({ findings: [finding] });
  
  expect(analysis.riskScore).toBeGreaterThan(70);
});
```

## Integration Testing

### Testing AI Pipeline

The mock adapter tests verify the full analysis pipeline:

1. **Text Extraction** → Parses document structure
2. **Risk Analysis** → Identifies findings against rubric
3. **Synthesis** → Generates executive summary

### Testing Adapters

Each adapter (AI, Storage, DB) has:
- Mock implementation for testing
- Production implementation for real use
- Consistent interface for swapping

## Manual Testing Checklist

### Upload Flow
- [ ] Drag and drop files
- [ ] Multiple file upload
- [ ] PDF extraction
- [ ] DOCX extraction
- [ ] Progress indicators

### Results Dashboard
- [ ] Risk score calculation
- [ ] Findings table filtering
- [ ] Severity sorting
- [ ] Chart rendering
- [ ] Export functionality

### Document Viewer
- [ ] Source highlighting
- [ ] Click to scroll
- [ ] Zoom controls
- [ ] Split pane view
- [ ] Finding selection sync

### Playbooks
- [ ] Create playbook
- [ ] Baseline extraction
- [ ] Comparison against playbook
- [ ] Playbook list display

### Version Comparison
- [ ] Upload two versions
- [ ] Clause-level diff
- [ ] Risk delta calculation
- [ ] Change visualization

### Feedback Loop
- [ ] Confirm finding
- [ ] Mark as not relevant
- [ ] Feedback persistence
- [ ] Visual feedback state

## Performance Testing

### Key Metrics to Monitor

- **Upload time**: < 5s for 10MB files
- **Extraction time**: < 2s for typical contracts
- **Analysis time**: < 5s (mock), varies (production)
- **Page load**: < 2s for dashboard
- **Interactive**: < 100ms for user actions

### Load Testing

```bash
# Simulate concurrent uploads (requires production setup)
# Not included in test suite - manual testing only
```

## Accessibility Testing

### Manual Checks
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected

### Tools
- Chrome DevTools Lighthouse
- axe DevTools extension
- WAVE accessibility checker

## Browser Compatibility

Tested and supported:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm verify
```

## Known Limitations

1. **Mock Mode Only**: Full testing requires OpenRouter/MongoDB/R2 setup
2. **E2E Tests**: Not included - consider Playwright for full flows
3. **Visual Regression**: Not automated - manual review required
4. **Performance Benchmarks**: Baseline metrics not established

## Future Testing Enhancements

- [ ] End-to-end tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking suite
- [ ] API contract testing
- [ ] Chaos engineering for error handling

## Troubleshooting

### Tests Failing

```bash
# Clear Jest cache
pnpm jest --clearCache

# Run with verbose output
pnpm test -- --verbose

# Run specific test file
pnpm test -- utils.test.ts
```

### Coverage Issues

```bash
# Generate detailed coverage report
pnpm test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

---

**Last Updated**: 2026-07-15  
**Test Suite Version**: 1.0.0  
**Coverage Target**: 70% (branches, functions, lines, statements)
