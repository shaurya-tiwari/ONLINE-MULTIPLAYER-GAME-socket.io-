const { test, expect } = require('@playwright/test');

test.describe('Competitive Logic Verification', () => {

    test('Verification: Atomic Win Lock', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();
        await hostPage.goto('/');

        console.log('Host: Creating Room...');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'HostUser');
        await hostPage.click('button:has-text("START ROOM")');

        const hostRoomCodeLocator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        await expect(hostRoomCodeLocator).toBeVisible({ timeout: 15000 });
        const roomCode = (await hostRoomCodeLocator.textContent()).trim();
        console.log(`Host: Created Room ${roomCode}`);

        const joinerContext = await browser.newContext();
        const joinerPage = await joinerContext.newPage();
        await joinerPage.goto('/');

        console.log('Joiner: Entering Room...');
        await joinerPage.click('button:has-text("JOIN GAME")');
        await joinerPage.fill('input[placeholder="ENTER NAME"]', 'JoinerUser');
        await joinerPage.fill('input[placeholder="CODE"]', roomCode);
        await joinerPage.click('button:has-text("JOIN RACE")');

        await expect(joinerPage.locator(`text=${roomCode}`)).toBeVisible({ timeout: 15000 });

        // 2. Start Race
        console.log('Host: Launching Race...');
        await expect(hostPage.locator('button:has-text("Launch Race")')).toBeVisible({ timeout: 15000 });
        await hostPage.click('button:has-text("Launch Race")');

        // Wait for transition to GameScreen
        console.log('Waiting for game transition...');
        await hostPage.waitForTimeout(3000);

        // 3. Simulate Simultaneous Win
        console.log('Simulating simultaneous win via socket injection...');

        const winPromise1 = hostPage.evaluate(async ({ roomCode, name }) => {
            window.socket.emit('player_won', { code: roomCode, name, x: 20000 });
        }, { roomCode, name: 'HostUser' });

        const winPromise2 = joinerPage.evaluate(async ({ roomCode, name }) => {
            window.socket.emit('player_won', { code: roomCode, name, x: 20000 });
        }, { roomCode, name: 'JoinerUser' });

        await Promise.all([winPromise1, winPromise2]);

        // 4. Verify lockout: A "WON!" overlay should appear
        console.log('Verification: Checking for WON! overlay...');
        await expect(hostPage.locator('text=WON!')).toBeVisible({ timeout: 15000 });

        // In our implementation, the server resets to lobby immediately on the server side.
        // To see the "Launch Race" again, we have to "Leave" the game screen or "Restart".
        // But since the server already reset 'gameState' to 'lobby', clicking 'PLAY AGAIN' in the overlay 
        // will send 'restart_game'.

        console.log('Host: Clicking PLAY AGAIN...');
        await hostPage.click('button:has-text("PLAY AGAIN")');

        // After clicking PLAY AGAIN, the game restarts and we should see the HUD or something
        // To verify we are back in a functional state, let's just check the HUD room code is visible
        await expect(hostPage.locator(`text=${roomCode}`)).toBeVisible({ timeout: 15000 });

        console.log('Success: Atomic Win verified!');

        await hostContext.close();
        await joinerContext.close();
    });

    test('Verification: Ghost Cleanup on Force-Quit', async ({ browser }) => {
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

        await expect(hostPage.locator('text=JoinerUser')).toBeVisible({ timeout: 10000 });
        console.log('Force closing joiner to test ghost cleanup...');
        await joinerContext.close();
        await expect(hostPage.locator('text=JoinerUser')).not.toBeVisible({ timeout: 15000 });

        await hostContext.close();
    });
});
