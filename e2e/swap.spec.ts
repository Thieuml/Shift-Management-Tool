import { test, expect } from '@playwright/test'

test.describe('Swap/Reassign Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ops page
    await page.goto('/ops')
  })

  test('should swap/reassign an engineer on an assigned shift', async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Find an assigned shift (status ASSIGNED)
    const assignedRow = page.locator('tr').filter({ hasText: 'ASSIGNED' }).first()
    
    if (await assignedRow.count() === 0) {
      test.skip('No assigned shifts found in test data')
    }

    // Get the current engineer name
    const currentEngineerCell = assignedRow.locator('td').nth(6) // Assigned Engineer column
    const currentEngineerName = await currentEngineerCell.textContent()
    
    // Click the dropdown button (should show current engineer name)
    const assignButton = assignedRow.locator('button').last()
    await expect(assignButton).toBeVisible()
    await assignButton.click()

    // Wait for dropdown to appear
    await page.waitForSelector('text=Unassign', { timeout: 5000 }).catch(() => {})
    
    // Wait for engineers list to load
    await page.waitForSelector('button[class*="text-gray-700"]', { timeout: 10000 })

    // Find a different engineer (not the current one)
    const engineerOptions = page.locator('button[class*="text-gray-700"]')
    const engineerCount = await engineerOptions.count()
    
    if (engineerCount === 0) {
      test.skip('No alternative engineers available')
    }

    // Select a different engineer
    let newEngineerName = ''
    for (let i = 0; i < engineerCount; i++) {
      const option = engineerOptions.nth(i)
      const text = await option.textContent()
      if (text && !text.includes(currentEngineerName || '') && !text.includes('(current)')) {
        newEngineerName = text.trim()
        await option.click()
        break
      }
    }

    if (!newEngineerName) {
      test.skip('Could not find alternative engineer')
    }

    // Wait for reassignment to complete
    await page.waitForTimeout(1000)

    // Verify the shift is now assigned to the new engineer
    await expect(assignedRow.locator(`button:has-text("${newEngineerName}")`)).toBeVisible({ timeout: 5000 })
    
    // Verify the engineer name in the table updated
    await expect(currentEngineerCell).not.toHaveText(currentEngineerName || '', { timeout: 5000 })
  })

  test('should unassign an engineer from an assigned shift', async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Find an assigned shift
    const assignedRow = page.locator('tr').filter({ hasText: 'ASSIGNED' }).first()
    
    if (await assignedRow.count() === 0) {
      test.skip('No assigned shifts found in test data')
    }

    // Click the dropdown button
    const assignButton = assignedRow.locator('button').last()
    await assignButton.click()

    // Wait for dropdown and click Unassign
    await page.waitForSelector('button:has-text("Unassign")', { timeout: 5000 })
    await page.locator('button:has-text("Unassign")').click()

    // Wait for unassignment to complete
    await page.waitForTimeout(1000)

    // Verify the shift is now unassigned
    await expect(assignedRow.locator('button:has-text("Assign Engineer")')).toBeVisible({ timeout: 5000 })
    
    // Verify status changed to UNASSIGNED
    await expect(assignedRow.locator('span:has-text("UNASSIGNED")')).toBeVisible({ timeout: 5000 })
  })
})

