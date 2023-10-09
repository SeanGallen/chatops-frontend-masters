import { type Handler, schedule } from "@netlify/functions";
import { getNewItem } from "./util/notion";
import { blocks, slackApi } from "./util/slack";

const postNewNotionItemsToSlack: Handler = async () => {
  const items = await getNewItem();

  await slackApi("chat.postMessage", {
    channel: "C0600GFLV0W",
    blocks: [
      blocks.section({
        text: [
          "Here are the demos awaiting showings:",
          "",
          ...items.map(
            (item) => `- ${item.option} (demo level: ${item.demoLevel})`
          ),
          "",
          `See all item <htts://notion.com/${process.env.NOTION_DATABASE_ID}|in Notion>.`,
        ].join("\n"),
      }),
    ],
  });
  return {
    statusCode: 200,
  };
};

export const handler = schedule("12 * * * *", postNewNotionItemsToSlack);
