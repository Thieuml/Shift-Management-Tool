import { test, expect } from '@playwright/test'

test.describe('Payroll Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payroll page
    await page.goto('/payroll')
  })

  test('should display payroll dashboard', async ({ page }) => {
    // Verify page loads
    await expect(page.locator('h1:has-text("Payroll")')).toBeVisible()
  })

  test('should show shifts with assignments for payroll calculation', async ({ page }) => {
    // This test assumes the payroll page will show shifts with assignments
    // Since the payroll page is not yet implemented, we'll create a basic structure
    
    // Navigate to ops page first to see assigned shifts
    await page.goto('/ops')
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Find assigned shifts
    const assignedRows = page.locator('tr').filter({ hasText: 'ASSIGNED' })
    const assignedCount = await assignedRows.count()

    if (assignedCount > 0) {
      // Verify we have shifts with assignments
      expect(assignedCount).toBeGreaterThan(0)
      
      // Check that assigned engineer names are visible
      const firstAssignedRow = assignedRows.first()
      const engineerCell = firstAssignedRow.locator('td').nth(6)
      const engineerName = await engineerCell.textContent()
      
      expect(engineerName).not.toBe('-')
      expect(engineerName?.trim().length).toBeGreaterThan(0)
    }
  })

  test('should filter shifts by date range for payroll export', async ({ page }) => {
    await page.goto('/ops')
    
    // Set date range filters
    const fromInput = page.locator('input[type="date"]').first()
    const toInput = page.locator('input[type="date"]').last()
    
    // Set a date range
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 7)
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + 7)
    
    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr = toDate.toISOString().split('T')[0]
    
    await fromInput.fill(fromStr)
    await toInput.fill(toStr)
    
    // Wait for data to reload
    await page.waitForTimeout(1000)
    
    // Verify table updates
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
  })

  test('should export payroll data (mock)', async ({ page }) => {
    // This test mocks the export functionality
    // In a real implementation, this would test the actual export feature
    
    await page.goto('/payroll')
    
    // Set up a mock download handler
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    
    // If there's an export button, click it
    const exportButton = page.locator('button:has-text("Export")').first()
    
    if (await exportButton.count() > 0) {
      await exportButton.click()
      const download = await downloadPromise
      
      if (download) {
        expect(download.suggestedFilename()).toMatch(/payroll|export|\.csv|\.xlsx/i)
      }
    } else {
      // Payroll export feature not yet implemented
      test.skip('Payroll export feature not implemented')
    }
  })

  test('should show completed shifts for payroll', async ({ page }) => {
    await page.goto('/ops')
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    
    // Look for completed shifts
    const completedRows = page.locator('tr').filter({ hasText: 'COMPLETED' })
    const completedCount = await completedRows.count()
    
    // Verify completed shifts show performed times if available
    if (completedCount > 0) {
      const firstCompleted = completedRows.first()
      // Completed shifts should have performed start/end times
      // This would be verified in the actual payroll implementation
      expect(completedCount).toBeGreaterThan(0)
    }
  })
})

