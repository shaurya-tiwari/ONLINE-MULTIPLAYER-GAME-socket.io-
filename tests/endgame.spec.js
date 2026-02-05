const { test, expect } = require('@playwright/test');

test.describe('Endgame and Restart Logic', () => {
    test('Verify winner name and host restart', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
        await page.goto('/');

        // 1. Host Creates Room
        await page.click('button:has-text("HOST GAME")');
        await page.fill('input[placeholder="ENTER NAME"]', 'TestHost');
        await page.click('button:has-text("START ROOM")');

        // 2. Wait for Lobby
        await expect(page.locator('text=Athletes')).toBeVisible({ timeout: 15000 });

        // Extract Room Code
        const roomCode = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('div, span')).find(e => /^[A-Z0-9]{4}$/.test(e.innerText.trim()));
            return el ? el.innerText.trim() : null;
        });
        console.log(`Test: Room Code is ${roomCode}`);

        // 3. Start Game
        console.log("Test: Clicking Launch Race...");
        await page.locator('button:has-text("Launch Race")').click({ force: true });

        // Wait for canvas to appear
        console.log("Test: Waiting for canvas...");
        await expect(page.locator('canvas')).toBeVisible({ timeout: 20000 });

        // Wait for countdown to definitely finish (3s countdown + 1.5s GO! + buffer)
        console.log("Test: Waiting for countdown...");
        await page.waitForTimeout(9000);

        // 4. Cheat/Move player to finish line and trigger win
        console.log("Test: Emitting player_won...");
        await page.evaluate(({ code, name }) => {
            console.log(`[BROWSER TEST] Emitting win for ${name} in ${code}`);
            if (window.socket) {
                // Correct finish line for 500m is 15000px
                window.socket.emit('player_won', { code: code, name: name, x: 15100 });
            }
        }, { code: roomCode, name: 'TestHost' });

        // 5. Verify Overlay displays winner name
        console.log("Test: Waiting for Victory Overlay...");
        await expect(page.locator('text=TestHost WON!')).toBeVisible({ timeout: 20000 });

        // 6. Verify Restart button visibility for host
        const restartBtn = page.locator('button:has-text("PLAY AGAIN")');
        await expect(restartBtn).toBeVisible();

        // 7. Click Restart
        console.log("Test: Clicking Restart...");
        await restartBtn.click({ force: true });

        // 8. Verify UI resets (Overlay disappears)
        await expect(page.locator('text=TestHost WON!')).not.toBeVisible({ timeout: 15000 });

        console.log("Test: Success!");
    });
});
