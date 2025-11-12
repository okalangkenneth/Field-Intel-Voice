# /test-crm-sync - Test CRM Integration

## Purpose
Test CRM API connectivity and data sync without modifying production data. Uses sandbox/test environments.

## Parameters
- `crm`: Which CRM to test (salesforce | hubspot | pipedrive)
- `mode`: Test mode (read | write | full) - default: read
- `sample`: Use sample data (true | false) - default: true

## Actions
1. Verify CRM credentials are configured
2. Test API authentication
3. If mode=read: Fetch sample contact/account data
4. If mode=write: Create test record in sandbox
5. If mode=full: Create, read, update, delete test record
6. Display sync results and timing
7. Clean up test data

## Example Usage
```
/test-crm-sync crm=salesforce
/test-crm-sync crm=hubspot mode=full
/test-crm-sync crm=pipedrive mode=write sample=true
```

## Expected Output
```
🔗 CRM Sync Test: Salesforce
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Authentication: ✅ Success
Environment: Sandbox
API Version: v58.0

Test Mode: Full (CRUD Operations)

1. CREATE Contact
   ✅ Created: John Test (ID: 003xxx)
   Time: 450ms

2. READ Contact
   ✅ Retrieved: John Test
   Fields: Name, Email, Phone, Company
   Time: 180ms

3. UPDATE Contact
   ✅ Updated: Added "Test Activity" note
   Time: 320ms

4. DELETE Contact
   ✅ Deleted: Contact removed
   Time: 210ms

Total Test Time: 1.16s
All operations: PASSED ✅

Rate Limit: 4,850 / 5,000 calls remaining
```

## Safety Checks
- NEVER test against production CRM environment
- Always use sandbox/test credentials
- Delete all test data after completion
- Verify data isolation (no real customer data affected)
- Check rate limits before running
- Validate OAuth tokens are not expired

## Success Criteria
- ✅ Authentication successful
- ✅ All CRUD operations complete in <2s total
- ✅ No data left in sandbox after test
- ✅ Proper error handling for auth failures
- ✅ Rate limit tracking working

## Troubleshooting
- Auth failed? Check token expiration and refresh
- Rate limit hit? Wait 1 hour or use different credentials
- Sandbox not available? Check CRM org settings
- Timeout? Check network connection and API status
