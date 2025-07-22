# Action Bias Coding Standards

## 🎯 MVP Principles (80/20 Rule)

### 1. **NO BACKUP FILES IN CODEBASE**
- ❌ Never create `.backup`, `.backup.ts`, `.broken`, `.legacy` files
- ✅ Use Git for version control instead
- ✅ If you need to save work, commit to a feature branch

### 2. **SINGLE SOURCE OF TRUTH**
- ❌ Don't duplicate calculation logic across components
- ✅ Create reusable hooks for shared logic
- ✅ Use the `usePortfolioCalculations` hook for all portfolio math

### 3. **COMPONENT SIZE LIMITS**
- ❌ Components > 500 lines (split them)
- ❌ Files > 50KB (refactor into smaller pieces)
- ✅ Keep components focused and single-purpose

### 4. **TYPE SAFETY**
- ✅ Always use TypeScript interfaces
- ✅ No `any` types unless absolutely necessary
- ✅ Use proper type imports from `@/app/lib/types/shared`

### 5. **FILE ORGANIZATION**
```
app/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── forms/          # Form components
│   └── [feature]/      # Feature-specific components
├── lib/                # Utilities and business logic
│   ├── types/          # TypeScript definitions
│   └── [domain]/       # Domain-specific utilities
├── api/                # API routes
└── hooks/              # Custom React hooks
```

### 6. **NAMING CONVENTIONS**
- ✅ Components: PascalCase (`PortfolioCard.tsx`)
- ✅ Hooks: camelCase with `use` prefix (`usePortfolioData.ts`)
- ✅ Utilities: camelCase (`currency.ts`, `exchangeRates.ts`)
- ✅ Types: PascalCase (`Holding`, `CategoryData`)

### 7. **IMPORT STANDARDS**
- ✅ Use absolute imports: `@/app/components/...`
- ✅ Group imports: React, then external, then internal
- ✅ No relative imports beyond one level (`../`)

### 8. **ERROR HANDLING**
- ✅ Always wrap API calls in try-catch
- ✅ Provide fallback values for calculations
- ✅ Log errors with context

### 9. **PERFORMANCE**
- ✅ Use `useMemo` for expensive calculations
- ✅ Use `useCallback` for function props
- ✅ Avoid unnecessary re-renders

### 10. **TESTING**
- ✅ Test critical business logic
- ✅ Test edge cases (null values, currency conversion)
- ✅ Test mobile responsiveness

## 🚨 RED FLAGS (Stop and Refactor)

1. **File > 50KB** → Split into smaller components
2. **Component > 500 lines** → Extract sub-components
3. **Duplicate logic in 2+ places** → Create shared hook/utility
4. **More than 3 backup files** → Clean up immediately
5. **Any `any` types** → Define proper interfaces
6. **Hardcoded values** → Move to constants/config

## 📋 CODE REVIEW CHECKLIST

- [ ] No backup files created
- [ ] Single source of truth for calculations
- [ ] Proper TypeScript types used
- [ ] Component size reasonable
- [ ] No duplicate logic
- [ ] Mobile responsive
- [ ] Error handling in place
- [ ] Performance optimized

## 🔧 REFACTORING GUIDELINES

1. **Always test before and after**
2. **Make incremental changes**
3. **Keep one working version**
4. **Document breaking changes**
5. **Update this document if needed**

---

**Remember: This is an MVP. Keep it lean, clean, and focused on the 80/20 principle.** 