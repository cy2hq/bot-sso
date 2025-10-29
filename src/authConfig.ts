import config from "./internal/config";

const oboAuthConfig: any = {
  authorityHost: config.authorityHost,
  clientId: config.clientId,
  tenantId: config.tenantId,
  clientSecret: config.clientSecret,
};

export default oboAuthConfig;