import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { ResponseWrapper } from "./responseWrapper";
import { Activity } from "botbuilder";
import { adapter, bot, notificationApp } from "../index";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const activity: Activity = req.body;

  console.log('Received message...')
  if (activity.type === "message" && activity.value) {
    const actionData = activity.value;

    if (actionData.action === "sendMessage") {
      console.log('Processing sendMessage action...');
      // console.log('Action data:', actionData);
      await fetch(
        actionData.url,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({message: actionData.message})
        }
      );
    }
  } else {
    console.log('Processing message with bot adapter...');
    await adapter.process(req, context.res as any, async (turnContext) => {
      await bot.run(turnContext);
    });

    const res = new ResponseWrapper(context.res);
    await notificationApp.requestHandler(req, res);
    return res.body;
  }
};

export default httpTrigger;