import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { notificationApp } from "../index";
import { ResponseWrapper } from "./responseWrapper";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<any> {
  const res = new ResponseWrapper(context.res);
  const adaptedReq = {
    ...req,
    method: req.method ?? undefined,
  } as any;
  await notificationApp.requestHandler(adaptedReq, res);
  return res.body;
};

export default httpTrigger;