# Monthly Snapshots CSV Import Script

This script allows you to import monthly financial data from CSV files into the Action Bias database.

## 📋 Prerequisites

- Node.js and npm installed
- Database connection configured (`.env.local` file)
- Prisma client generated (`npm run build`)

## 📊 CSV Format

Your CSV file should have the following columns:

```csv
period,income,expenses,portfolio_value,net_worth,notes
2024-01,8500,3200,125000,125000,January snapshot
2024-02,8500,3100,128000,128000,February snapshot
```

### Column Details

- **period**: YYYY-MM format (e.g., 2024-01, 2023-12)
- **income**: Monthly income amount (can include $, commas)
- **expenses**: Monthly expenses amount (can include $, commas)
- **portfolio_value**: Portfolio value at end of month (can include $, commas)
- **net_worth**: Net worth at end of month (can include $, commas)
- **notes**: Optional text description (optional column)

## 🚀 Usage

### Basic Import

```bash
npm run import-monthly-snapshots <path-to-csv-file>
```

### Examples

```bash
# Import from sample file
npm run import-monthly-snapshots ./data/sample-monthly-snapshots.csv

# Import from your own file
npm run import-monthly-snapshots ./my-monthly-data.csv

# Import from absolute path
npm run import-monthly-snapshots /Users/username/Documents/financial-data.csv
```

## 🔧 Features

### ✅ Automatic Validation
- Validates period format (YYYY-MM)
- Checks for required fields
- Parses numeric values (removes currency symbols, commas)
- Validates month range (1-12)

### ✅ Duplicate Prevention
- Skips existing snapshots for the same period
- Prevents data overwrites
- Reports skipped entries

### ✅ Error Handling
- Detailed error messages for each row
- Continues processing even if some rows fail
- Summary report at the end

### ✅ Flexible Input
- Handles currency symbols ($, €, £, ¥, ₹)
- Removes commas and whitespace
- Supports quoted CSV values

## 📈 Output

The script provides real-time feedback:

```
🚀 Starting import from: ./data/sample-monthly-snapshots.csv
📋 Using user ID: clx1234567890abcdef
📖 Skipping header: period,income,expenses,portfolio_value,net_worth,notes
✅ Processed line 2: 2024-01
✅ Processed line 3: 2024-02
...
✅ Imported: 2024-01 | Income: $8,500 | Expenses: $3,200 | Savings: $5,300
✅ Imported: 2024-02 | Income: $8,500 | Expenses: $3,100 | Savings: $5,400
...

📈 Import Summary:
   ✅ Successfully imported: 12
   ⏭️  Skipped (already exists): 0
   ❌ Errors: 0
   📊 Total processed: 12

🎉 Import completed successfully!
```

## 🛠️ Troubleshooting

### Common Issues

1. **File not found**
   ```
   Error: CSV file not found: ./my-file.csv
   ```
   - Check the file path is correct
   - Ensure the file exists

2. **Invalid period format**
   ```
   Error: Invalid period format: 2024/01. Expected format: YYYY-MM
   ```
   - Use YYYY-MM format (e.g., 2024-01, not 2024/01)

3. **Missing required field**
   ```
   Error: Missing required field: income
   ```
   - Ensure all required columns are present
   - Check CSV header matches expected format

4. **Database connection issues**
   ```
   Error: connect ECONNREFUSED
   ```
   - Check your `.env.local` file has correct DATABASE_URL
   - Ensure database is running

### Getting Help

If you encounter issues:

1. Check the error messages for specific details
2. Verify your CSV format matches the example
3. Ensure your database connection is working
4. Try with the sample file first: `npm run import-monthly-snapshots ./data/sample-monthly-snapshots.csv`

## 📝 Notes

- The script automatically creates a default user if none exists
- Existing snapshots for the same period will be skipped
- The script processes files line by line for memory efficiency
- All monetary values are stored as numbers (no currency symbols in database)
- Notes are optional and can be empty

## 🔄 Updating Existing Data

To update existing monthly snapshots:

1. Delete the existing snapshots from the database (via UI or API)
2. Run the import script with your updated CSV
3. Or modify the script to handle updates (requires code changes)

## 📊 Data Verification

After import, verify your data:

1. Check the monthly snapshots tab in the Financial Setup modal
2. Verify the savings rates are calculated correctly
3. Check that all periods are imported as expected 