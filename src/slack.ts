import type { Handler } from "@netlify/functions";
import { parse } from "querystring";
import { blocks, modal, slackApi, verifySlackRequest } from "./util/slack";
import { saveItem } from "./util/notion";

async function handleSlashCommand(payload: SlackSlashCommandPayload) {
  switch (payload.command) {
    case "/demo":
      const response = await slackApi(
        "views.open",
        modal({
          id: "demo-modal",
          title: "Start a demo",
          trigger_id: payload.trigger_id,
          blocks: [
            blocks.section({
              text: "The area to learn more about the demo",
            }),
            blocks.input({
              id: "option",
              label: "Demo Slack Api",
              placeholder: "Example: this is a slack api demo",
              initial_value: payload.text ?? "",
              hint: "This is a hint. Dogs rule.",
            }),
            blocks.select({
              id: "demo_level",
              label: "A selection label",
              placeholder: "Select a demo level",
              options: [
                { label: "Slack", value: "Slack's api" },
                { label: "YouTube", value: "YouTube's api" },
                { label: "Teams", value: "Team's api" },
                { label: "Notion", value: "Notion's api" },
              ],
            }),
          ],
        })
      );

      if (!response.ok) {
        console.log("look ", response);
      }
      break;
    default:
      return {
        statusCode: 200,
        body: `Command ${payload.command} is not recognized`,
      };
  }
  return {
    statusCode: 200,
    body: "",
  };
}

async function handleInteractivity(payload: SlackModalPayload) {
  const callback_id = payload.callback_id ?? payload.view.callback_id;
  switch (callback_id) {
    case "demo-modal":
      const data = payload.view.state.values;
      console.log("data ", data);
      const fields = {
        option: data.option_block.option.value,
        demoLevel: data.demo_level_block.demo_level.selected_option.value,
        submitter: payload.user.name,
      };
      await saveItem(fields);

      await slackApi("chat.postMessage", {
        channel: "C0600GFLV0W",
        text: `Oh wow, look at this demo <@${payload.user.id}> just started a demo for ${fields.demoLevel} \n\n*${fields.option}*\n\n `,
      });
      break;
    case "demo-shortcut":
      const channel = payload.channel?.id;
      const user_id = payload.user.id;
      const thread_ts = payload.message.thread_ts ?? payload.message.ts;

      await slackApi("chat.postMessage", {
        channel,
        thread_ts,
        text: `Hey <@${user_id}>, this sounds like a great topic for a demo`,
      });
      break;
    default:
      console.log(`No handle defined for ${callback_id}`);
      return {
        statusCode: 400,
        body: `No handle defined for ${callback_id}`,
      };
  }
  return {
    statusCode: 200,
    body: "",
  };
}
export const handler: Handler = async (event) => {
  const valid = verifySlackRequest(event);

  if (!valid) {
    console.error("invalid request");
    return {
      statusCode: 400,
      body: "invalid request",
    };
  }

  const body = parse(event.body ?? "") as SlackPayload;
  if (body.command) {
    return handleSlashCommand(body as SlackSlashCommandPayload);
  }
  if (body.payload) {
    const payload = JSON.parse(body.payload);
    return handleInteractivity(payload);
  }

  return {
    statusCode: 200,
    body: "TODO: handle Slack commands and interactivity",
  };
};
