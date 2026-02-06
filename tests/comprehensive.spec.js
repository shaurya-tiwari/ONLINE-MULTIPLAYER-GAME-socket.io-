const { test, expect } = require('@playwright/test');

test.describe('Detailed Game Functionality (A-Z Verification)', () => {

    const setupConsole = (page, prefix) => {
        page.on('console', msg => {
            console.log(`[BROWSER ${prefix}] ${msg.text()}`);
        });
    };

    test('Lobby: Verify 4-Player Capacity Limit', async ({ browser }) => {
        const hostContext = await browser.newContext();
        const hostPage = await hostContext.newPage();
        setupConsole(hostPage, 'HOST');
        await hostPage.goto('/');

        // 1. Host Creates Room
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'Host');
        await hostPage.click('button:has-text("START ROOM")');

        // 2. Wait for Lobby transition (Look for unique text)
        await expect(hostPage.locator('h3:has-text("Athletes")')).toBeVisible({ timeout: 20000 });

        // Extract Room Code (Handle potential boiler-plate)
        const locator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        const raw = await locator.textContent();
        const codeMatch = raw.match(/[A-Z0-9]{4}/);
        const roomCode = codeMatch ? codeMatch[0] : raw.trim();
        console.log(`Lobby Capacity Test: Room ${roomCode} created.`);

        // 3. Join 3 Players
        const players = ['A', 'B', 'C'];
        const pPageRefs = [];
        for (let i = 0; i < players.length; i++) {
            const name = players[i];
            const ctx = await browser.newContext();
            const p = await ctx.newPage();
            setupConsole(p, `P_${name}`);
            await p.goto('/');
            await p.click('button:has-text("JOIN GAME")');
            await p.fill('input[placeholder="ENTER NAME"]', name);
            await p.fill('input[placeholder="CODE"]', roomCode);
            await p.click('button:has-text("JOIN RACE")');

            // Ensure this player joined successfully
            const count = i + 2;
            await expect(p.locator(`text=${count}/4`)).toBeVisible({ timeout: 15000 });
            pPageRefs.push(p);
            await hostPage.waitForTimeout(500); // Stagger joins
        }

        // 4. Verification: 4/4 on host
        await expect(hostPage.locator('text=4/4')).toBeVisible({ timeout: 10000 });

        // 5. Join 5th Player (Should Error)
        const p5Page = await (await browser.newContext()).newPage();
        setupConsole(p5Page, 'P5');
        const dialogPromise = p5Page.waitForEvent('dialog');
        await p5Page.goto('/');
        await p5Page.click('button:has-text("JOIN GAME")');
        await p5Page.fill('input[placeholder="ENTER NAME"]', 'P5_TOO_MANY');
        await p5Page.fill('input[placeholder="CODE"]', roomCode);
        await p5Page.click('button:has-text("JOIN RACE")');

        const dialog = await dialogPromise;
        expect(dialog.message()).toContain('Room is full');
        await dialog.dismiss();

        await hostContext.close();
        for (const p of pPageRefs) await p.close();
        await p5Page.context().close();
    });

    test('State Machine: Block Join-In-Progress', async ({ browser }) => {
        const hostPage = await (await browser.newContext()).newPage();
        await hostPage.goto('/');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'Host');
        await hostPage.click('button:has-text("START ROOM")');

        await expect(hostPage.locator('h3:has-text("Athletes")')).toBeVisible();
        const locator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        const raw = await locator.textContent();
        const roomCode = raw.match(/[A-Z0-9]{4}/)[0];

        await hostPage.click('button:has-text("Launch Race")');
        await expect(hostPage.locator('canvas')).toBeVisible();

        const latePage = await (await browser.newContext()).newPage();
        const dialogPromise = latePage.waitForEvent('dialog');
        await latePage.goto('/');
        await latePage.click('button:has-text("JOIN GAME")');
        await latePage.fill('input[placeholder="ENTER NAME"]', 'LateJoiner');
        await latePage.fill('input[placeholder="CODE"]', roomCode);
        await latePage.click('button:has-text("JOIN RACE")');

        const dialog = await dialogPromise;
        expect(dialog.message()).toContain('Game already started');
        await dialog.dismiss().catch(() => { }); // Catch closure errors
        await latePage.waitForTimeout(500); // Small delay to let dialog settle
        await hostPage.context().close();
        await latePage.context().close();
    });

    test('Sync: Verify Map Determinism (Identity Sync)', async ({ browser }) => {
        const hostPage = await (await browser.newContext()).newPage();
        await hostPage.goto('/');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'Host');
        await hostPage.click('button:has-text("START ROOM")');

        await expect(hostPage.locator('h3:has-text("Athletes")')).toBeVisible();
        const locator = hostPage.locator('span.text-6xl, span.text-lg').filter({ hasText: /^[A-Z0-9]{4}$/ }).first();
        const raw = await locator.textContent();
        const roomCode = raw.match(/[A-Z0-9]{4}/)[0];

        const joinerPage = await (await browser.newContext()).newPage();
        await joinerPage.goto('/');
        await joinerPage.click('button:has-text("JOIN GAME")');
        await joinerPage.fill('input[placeholder="ENTER NAME"]', 'Joiner');
        await joinerPage.fill('input[placeholder="CODE"]', roomCode);
        await joinerPage.click('button:has-text("JOIN RACE")');

        await hostPage.click('button:has-text("Launch Race")');
        await hostPage.waitForTimeout(3000);

        const hMap = await hostPage.evaluate(() => window.socket && window.socket.gameMap ? Array.from(new Uint8Array(window.socket.gameMap)) : null);
        const jMap = await joinerPage.evaluate(() => window.socket && window.socket.gameMap ? Array.from(new Uint8Array(window.socket.gameMap)) : null);

        expect(hMap).not.toBeNull();
        expect(jMap).not.toBeNull();
        expect(hMap).toEqual(jMap);
        await hostPage.context().close();
        await joinerPage.context().close();
    });

    test('UI Logic: Verify Race Length Scaling', async ({ browser }) => {
        const hostPage = await (await browser.newContext()).newPage();
        await hostPage.goto('/');
        await hostPage.click('button:has-text("HOST GAME")');
        await hostPage.click('button:has-text("3000m")');
        await hostPage.fill('input[placeholder="ENTER NAME"]', 'Host');
        await hostPage.click('button:has-text("START ROOM")');

        await expect(hostPage.locator('text=3000m')).toBeVisible();
        await hostPage.context().close();
    });
});
