import { DataSource } from "typeorm";
import { event } from "../entity/event";
import { vendorResponse } from "../entity/vendorResponse";
import { vendorResponseVariable } from "../entity/vendorResponseVariable";
import { adaptiveCardTemplate } from "../entity/adaptiveCardTemplate";
import { templateVariable } from "../entity/templateVariable";
import { VendorResponseTemplateMapping } from "../entity/vendorResponseTemplateMapping";
import { responseVariableMapping } from "../entity/responseVariableMapping";
import { VendorRequestTemplateMapping } from "../entity/vendorRequestTemplateMapping";
import { templateAction } from "../entity/templateAction";
import { vendorRequestVariable } from "../entity/vendorRequestVariable";
import { vendorRequest } from "../entity/vendorRequest";
import { requestVariableMapping } from "../entity/requestVariableMapping";
import { vendor } from "../entity/vendor";

console.log("Initializing Data Source...");

export const AppDataSource = new DataSource({
    type: "postgres",
    ssl: { rejectUnauthorized: false },
    host: "sca-bot.postgres.database.azure.com",
    port: 5432,
    username: "scabotadmin",
    password: "RWmUZcakpQ66Xg",
    database: "postgres",
    synchronize: true,
    logging: true,
    entities: [
        event,
        vendorResponse,
        vendorResponseVariable,
        adaptiveCardTemplate,
        templateVariable,
        VendorResponseTemplateMapping,
        responseVariableMapping,
        templateAction,
        VendorRequestTemplateMapping,
        vendorRequestVariable,
        vendorRequest,
        requestVariableMapping,
        vendor
    ],
    subscribers: [],
    migrations: [
        "../migrations/*.ts"
    ],
    migrationsTableName: "migrations"
})