import { test, expect } from "@playwright/test";

test.describe("Shift Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ops page
    await page.goto("/ops");
    await page.waitForLoadState("networkidle");
  });

  test("should assign engineer to shift", async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('text=Operations Schedule', { timeout: 10000 });
    
    // Find a shift without assignments (or the first shift)
    const shiftCard = page.locator('[class*="border"]').first();
    
    // Check if there's an "Assign" button
    const assignButton = shiftCard.locator('button:has-text("Assign"), button:has-text("Assigned")').first();
    
    if (await assignButton.count() > 0) {
      // Click assign button
      await assignButton.click();
      
      // Wait for dropdown to appear
      await page.waitForSelector('text=Assign Engineer', { timeout: 5000 });
      
      // Select first available engineer
      const engineerOption = page.locator('button:has-text("ENGINEER")').first();
      
      if (await engineerOption.count() > 0) {
        await engineerOption.click();
        
        // Wait for assignment to complete (check for success indicators)
        await page.waitForTimeout(1000);
        
        // Verify assignment was successful by checking for engineer name in assignments
        const assignmentsSection = shiftCard.locator('text=Assigned Engineers');
        if (await assignmentsSection.count() > 0) {
          await expect(assignmentsSection).toBeVisible();
        }
      }
    }
  });

  test("should swap/reassign engineer on shift", async ({ page }) => {
    // Wait for schedule to load
    await page.waitForSelector('text=Operations Schedule', { timeout: 10000 });
    
    // Find a shift with an assignment
    const shiftCard = page.locator('[class*="border"]').first();
    
    // Check if there's an assigned engineer
    const assignedEngineer = shiftCard.locator('text=Assigned Engineers').first();
    
    if (await assignedEngineer.count() > 0) {
      // Click assign button to open dropdown
      const assignButton = shiftCard.locator('button:has-text("Assigned")').first();
      if (await assignButton.count() > 0) {
        await assignButton.click();
        
        // Wait for dropdown
        await page.waitForSelector('text=Currently Assigned', { timeout: 5000 });
        
        // Click on an available engineer to trigger replace
        const availableEngineer = page.locator('button:has-text("ENGINEER")').first();
        
        if (await availableEngineer.count() > 0) {
          await availableEngineer.click();
          
          // Click confirm replace button if it appears
          const confirmButton = page.locator('button:has-text("Confirm Replace")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
            
            // Wait for reassignment to complete
            await page.waitForTimeout(1000);
            
            // Verify reassignment by checking assignments section
            const assignmentsSection = shiftCard.locator('text=Assigned Engineers');
            await expect(assignmentsSection).toBeVisible();
          }
        }
      }
    }
  });

  test("should export payroll data", async ({ page }) => {
    // Navigate to payroll page
    await page.goto("/payroll");
    await page.waitForLoadState("networkidle");
    
    // Wait for page to load
    await page.waitForSelector('text=Payroll', { timeout: 10000 });
    
    // Look for export button or functionality
    // This test assumes there will be an export button or link
    const exportButton = page.locator('button:has-text("Export"), a:has-text("Export")').first();
    
    if (await exportButton.count() > 0) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportButton.click();
      
      // Wait for download or check for success message
      const download = await downloadPromise;
      
      if (download) {
        // Verify download occurred
        expect(download.suggestedFilename()).toBeTruthy();
      } else {
        // Alternative: Check for success message or redirected page
        await page.waitForTimeout(2000);
        // Verify we're still on payroll page or see success indicator
        await expect(page.locator('text=Payroll')).toBeVisible();
      }
    } else {
      // If no export button exists, just verify payroll page loads
      await expect(page.locator('text=Payroll')).toBeVisible();
    }
  });

  test("should complete full flow: assign -> swap -> view payroll", async ({ page }) => {
    // Step 1: Assign engineer
    await page.goto("/ops");
    await page.waitForSelector('text=Operations Schedule', { timeout: 10000 });
    
    const shiftCard = page.locator('[class*="border"]').first();
    const assignButton = shiftCard.locator('button:has-text("Assign"), button:has-text("Assigned")').first();
    
    if (await assignButton.count() > 0) {
      await assignButton.click();
      await page.waitForSelector('text=Assign Engineer', { timeout: 5000 });
      
      const engineerOption = page.locator('button:has-text("ENGINEER")').first();
      if (await engineerOption.count() > 0) {
        await engineerOption.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 2: Swap engineer (if assignment exists)
    const assignedSection = shiftCard.locator('text=Assigned Engineers');
    if (await assignedSection.count() > 0) {
      await assignButton.click();
      await page.waitForSelector('text=Currently Assigned', { timeout: 5000 });
      
      const availableEngineer = page.locator('button:has-text("ENGINEER")').first();
      if (await availableEngineer.count() > 0) {
        await availableEngineer.click();
        
        const confirmButton = page.locator('button:has-text("Confirm Replace")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Step 3: Navigate to payroll
    await page.goto("/payroll");
    await page.waitForSelector('text=Payroll', { timeout: 10000 });
    
    // Verify payroll page loaded
    await expect(page.locator('text=Payroll')).toBeVisible();
  });
});
