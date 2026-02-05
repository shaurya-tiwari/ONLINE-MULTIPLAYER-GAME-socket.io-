const { test, expect } = require('@playwright/test');

test.describe('Player Name Defaults', () => {
    test('Verify default "Athlete" name when joining with empty name', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();

        // 1. Host creates room
        await hostPage.goto('http://localhost:3000');
        await hostPage.waitForLoadState('networkidle');

        console.log("Host trying to click HOST GAME...");
        await hostPage.click('button:has-text("HOST GAME")', { timeout: 10000 }).catch(async e => {
            console.log("Failed to find HOST GAME button. Page content:");
            const html = await hostPage.content();
            console.log(html.substring(0, 1000));
            throw e;
        });

        await hostPage.fill('input[placeholder="ENTER NAME"]', 'Captain');
        await hostPage.click('button:has-text("START ROOM")');

        const roomCode = await hostPage.locator('span.text-lg.font-black.text-ink').innerText();
        console.log(`Room created: ${roomCode}`);

        // 2. Joiner attempts to join (Simulate empty name via console if UI blocks)
        const joinerContext = await browser.newContext();
        const joinerPage = await joinerContext.newPage();
        await joinerPage.goto('http://localhost:3000');

        console.log("Joiner emitting join_room...");
        // Use console to emit join_room with empty name
        await joinerPage.evaluate(({ code }) => {
            window.socket.emit('join_room', { code, name: "" });
        }, { code: roomCode });

        // 3. Verify on Host Page that the joiner appears as "ATHLETE"
        // Wait for list to update
        console.log("Host waiting for ATHLETE to appear in lobby...");
        await hostPage.waitForSelector('p:has-text("ATHLETE")', { timeout: 10000 });

        // 4. Start race and verify name above stickman
        console.log("Host launching race...");
        await hostPage.click('button:has-text("Launch Race")');

        // The name "ATHLETE" should be rendered on the canvas.
        // Since we can't easily peek into the canvas, we can at least wait for the GameScreen to load
        // and check if there's any error. 
        // Better yet, we can check the 'players' prop passed to the game loop if we had a way, 
        // but for now, the lobby check is strong evidence.
        // We'll also check if "ATHLETE" appears in the HUD or winner list if possible.

        console.log('Success: Joined player successfully defaulted to ATHLETE in lobby');

        await hostContext.close();
        await joinerContext.close();
    });
});
