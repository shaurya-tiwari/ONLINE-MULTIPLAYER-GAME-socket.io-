const { test, expect } = require('@playwright/test');

test.describe('Auto-Exit Bug Verification', () => {

    test('Verification: No Auto-Exit when player leaves mid-race', async ({ browser }) => {
        // 1. Setup Host and Joiner
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();
        await hostPage.goto('/');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'HostUser');
        await hostPage.click('button:has-text("START ROOM")');

        const hostRoomCodeLocator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        await expect(hostRoomCodeLocator).toBeVisible();
        const roomCode = (await hostRoomCodeLocator.textContent()).trim();

        const joinerContext = await browser.newContext();
        const joinerPage = await joinerContext.newPage();
        await joinerPage.goto('/');
        await joinerPage.click('button:has-text("JOIN GAME")');
        await joinerPage.fill('input[placeholder="ENTER NAME"]', 'JoinerUser');
        await joinerPage.fill('input[placeholder="CODE"]', roomCode);
        await joinerPage.click('button:has-text("JOIN RACE")');

        // Wait for Joiner in Lobby
        await expect(hostPage.locator('text=JoinerUser')).toBeVisible();

        // 2. Start Race
        await hostPage.click('button:has-text("Launch Race")');

        // Wait for both to be in game screen (Canvas visible)
        await expect(hostPage.locator('canvas')).toBeVisible({ timeout: 10000 });
        await expect(joinerPage.locator('canvas')).toBeVisible({ timeout: 10000 });

        console.log('Race started. Force closing joiner...');

        // 3. Force Close Joiner
        await joinerContext.close();

        // 4. Verification: Host should STAY in the race (Canvas should remain visible)
        // If the bug exists, the host would be "Auto-Exited" to the lobby screen.
        await hostPage.waitForTimeout(2000); // Wait for potential accidental transition

        console.log('Verifying host is still in the race...');
        await expect(hostPage.locator('canvas')).toBeVisible();
        await expect(hostPage.locator('button:has-text("Launch Race")')).not.toBeVisible();

        console.log('Success: No Auto-Exit occurred!');

        await hostContext.close();
    });
});
