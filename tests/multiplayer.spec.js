const { test, expect } = require('@playwright/test');

test.describe('Multiplayer Competitiveness', () => {
    test('Host and Join a race', async ({ browser }) => {
        // 1. Create Host Context
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();
        hostPage.on('console', msg => console.log(`HOST CONSOLE: ${msg.text()}`));
        await hostPage.goto('/');

        console.log('Host: Navigating to Home...');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'HostUser');
        await hostPage.click('button:has-text("START ROOM")');

        console.log('Host: Waiting for Room Code...');
        const roomCodeLocator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        await expect(roomCodeLocator).toBeVisible({ timeout: 20000 });
        const roomCode = (await roomCodeLocator.textContent()).trim();
        console.log(`Host: Room Created with Code: [${roomCode}]`);

        // 2. Create Joiner Context
        const joinerContext = await browser.newContext();
        const joinerPage = await joinerContext.newPage();
        joinerPage.on('console', msg => console.log(`JOINER CONSOLE: ${msg.text()}`));
        await joinerPage.goto('/');

        console.log('Joiner: Navigating to Join sub-menu...');
        await joinerPage.click('button:has-text("JOIN GAME")');
        await joinerPage.fill('input[placeholder="ENTER NAME"]', 'JoinerUser');
        await joinerPage.fill('input[placeholder="CODE"]', roomCode);

        // Safety wait for state update
        await joinerPage.waitForTimeout(1000);

        console.log('Joiner: Clicking JOIN RACE...');
        await joinerPage.click('button:has-text("JOIN RACE")');

        console.log('Joiner: Verifying Lobby entry...');
        // Joiner should see "Room Code" text
        await expect(joinerPage.locator('text=Room Code')).toBeVisible({ timeout: 20000 });

        // Check for the code on joiner screen
        const joinerCodeLocator = joinerPage.locator('span.text-6xl, span.text-lg').filter({ hasText: roomCode }).first();
        await expect(joinerCodeLocator).toBeVisible({ timeout: 20000 });
        console.log('Joiner: Successfully in Lobby!');

        console.log('Verification: Checking players on both screens...');
        // Both should see each other
        await expect(hostPage.locator('p:has-text("JoinerUser")')).toBeVisible({ timeout: 20000 });
        await expect(joinerPage.locator('p:has-text("HostUser")')).toBeVisible({ timeout: 20000 });

        console.log('Success: Multiplayer connection verified!');
        await hostContext.close();
        await joinerContext.close();
    });
});
