/* @odoo-module */

import { UPDATE_BUS_PRESENCE_DELAY } from "@bus/im_status_service";

import { createLocalId } from "@mail/utils/common/misc";
import { Command } from "@mail/../tests/helpers/command";
import { afterNextRender, click, start, startServer } from "@mail/../tests/helpers/test_utils";

import { nextTick } from "@web/../tests/helpers/utils";

QUnit.module("im status");

QUnit.test("initially online", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo", im_status: "online" });
    const channelId = pyEnv["discuss.channel"].create({
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "chat",
    });
    const { openDiscuss } = await start();
    await openDiscuss(channelId);
    assert.containsOnce($, ".o-mail-ImStatus i[title='Online']");
});

QUnit.test("initially offline", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo", im_status: "offline" });
    const channelId = pyEnv["discuss.channel"].create({
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "chat",
    });
    const { openDiscuss } = await start();
    await openDiscuss(channelId);
    assert.containsOnce($, ".o-mail-ImStatus i[title='Offline']");
});

QUnit.test("initially away", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo", im_status: "away" });
    const channelId = pyEnv["discuss.channel"].create({
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "chat",
    });
    const { openDiscuss } = await start();
    await openDiscuss(channelId);
    assert.containsOnce($, ".o-mail-ImStatus i[title='Idle']");
});

QUnit.test("change icon on change partner im_status", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo", im_status: "online" });
    const channelId = pyEnv["discuss.channel"].create({
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "chat",
    });
    const { advanceTime, openDiscuss } = await start({ hasTimeControl: true });
    await openDiscuss(channelId);
    assert.containsOnce($, ".o-mail-ImStatus i[title='Online']");

    pyEnv["res.partner"].write([partnerId], { im_status: "offline" });
    await afterNextRender(() => advanceTime(UPDATE_BUS_PRESENCE_DELAY));
    assert.containsOnce($, ".o-mail-ImStatus i[title='Offline']");

    pyEnv["res.partner"].write([partnerId], { im_status: "away" });
    await afterNextRender(() => advanceTime(UPDATE_BUS_PRESENCE_DELAY));
    assert.containsOnce($, ".o-mail-ImStatus i[title='Idle']");

    pyEnv["res.partner"].write([partnerId], { im_status: "online" });
    await afterNextRender(() => advanceTime(UPDATE_BUS_PRESENCE_DELAY));
    assert.containsOnce($, ".o-mail-ImStatus i[title='Online']");
});

QUnit.test("Can handle im_status of unknown partner", async (assert) => {
    const { env, pyEnv } = await start();
    const partnerId = pyEnv["res.partner"].create({ name: "Bob" });
    const channelId = pyEnv["discuss.channel"].create({
        name: "General",
    });
    const [channel] = pyEnv["discuss.channel"].searchRead([["id", "=", channelId]]);
    pyEnv["bus.bus"]._sendone(channel, "mail.record/insert", {
        Partner: { im_status: "online", id: partnerId },
    });
    await nextTick();
    const persona = env.services["mail.store"].personas[createLocalId("partner", partnerId)];
    assert.ok(persona);
    assert.ok(persona.im_status === "online");
});

QUnit.test("show im status in messaging menu preview of chat", async (assert) => {
    const pyEnv = await startServer();
    const partnerId = pyEnv["res.partner"].create({ name: "Demo", im_status: "online" });
    pyEnv["discuss.channel"].create({
        channel_member_ids: [
            Command.create({ partner_id: pyEnv.currentPartnerId }),
            Command.create({ partner_id: partnerId }),
        ],
        channel_type: "chat",
    });
    await start();
    await click(".o_menu_systray i[aria-label='Messages']");
    assert.containsOnce(
        $,
        ".o-mail-NotificationItem:contains(Demo) i[aria-label='User is online']"
    );
});
