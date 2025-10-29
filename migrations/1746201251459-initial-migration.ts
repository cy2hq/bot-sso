import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1746201251459 implements MigrationInterface {
    name = 'InitialMigration1746201251459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "request_variable_mapping" ("requestVariableMappingId" SERIAL NOT NULL, "combine" boolean NOT NULL DEFAULT false, "name" character varying, "requestVariableId" integer, "responseVariableId" integer, "mappingRequestMappingId" integer NOT NULL, CONSTRAINT "PK_d991c35827f18a183786a00624b" PRIMARY KEY ("requestVariableMappingId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_request_variable" ("variableId" SERIAL NOT NULL, "internalName" character varying NOT NULL DEFAULT '', "displayName" character varying NOT NULL DEFAULT '', "isRequired" boolean NOT NULL DEFAULT true, "urlPathIndex" integer, "requestRequestId" integer NOT NULL, CONSTRAINT "PK_1696c76bbd43d1ad954a4d9c6cf" PRIMARY KEY ("variableId"))`);
        await queryRunner.query(`CREATE TABLE "vendor" ("vendorId" SERIAL NOT NULL, "name" character varying NOT NULL, "url" character varying NOT NULL, CONSTRAINT "PK_1440d0a09f3a270feeff706c01e" PRIMARY KEY ("vendorId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_request" ("requestId" SERIAL NOT NULL, "internalName" character varying NOT NULL DEFAULT '', "displayName" character varying NOT NULL DEFAULT '', "description" character varying, "endpoint" character varying NOT NULL DEFAULT '', "vendorVendorId" integer NOT NULL, CONSTRAINT "PK_f7bb43ed2b8482a3b01bbf783f1" PRIMARY KEY ("requestId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_request_template_mapping" ("requestMappingId" SERIAL NOT NULL, "name" character varying NOT NULL, "json" character varying, "requestRequestId" integer NOT NULL, "eventEventId" integer NOT NULL, "actionTemplateVariableId" integer NOT NULL, CONSTRAINT "PK_95ecf9be046f55ce439f8b6687f" PRIMARY KEY ("requestMappingId"))`);
        await queryRunner.query(`CREATE TABLE "template_action" ("templateVariableId" SERIAL NOT NULL, "internalName" character varying NOT NULL, "displayName" character varying NOT NULL, "defaultUrl" character varying NOT NULL DEFAULT '', "templateTemplateId" integer NOT NULL, CONSTRAINT "PK_f0bc515b0912d3ab57cdade7a6d" PRIMARY KEY ("templateVariableId"))`);
        await queryRunner.query(`CREATE TABLE "adaptive_card_template" ("templateId" SERIAL NOT NULL, "internalName" character varying NOT NULL, "displayName" character varying NOT NULL, "description" character varying, "isPublished" boolean NOT NULL DEFAULT false, "templateString" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_941702cceabe0dbd48f37377f60" PRIMARY KEY ("templateId"))`);
        await queryRunner.query(`CREATE TABLE "template_variable" ("templateVariableId" SERIAL NOT NULL, "internalName" character varying NOT NULL, "displayName" character varying NOT NULL, "isRequired" boolean NOT NULL DEFAULT true, "defaultValue" character varying NOT NULL DEFAULT '', "templateTemplateId" integer NOT NULL, CONSTRAINT "PK_08c6c158ec5c0a3875891c1de71" PRIMARY KEY ("templateVariableId"))`);
        await queryRunner.query(`CREATE TABLE "response_variable_mapping" ("responseVariableMappingId" SERIAL NOT NULL, "combine" boolean NOT NULL DEFAULT false, "name" character varying, "responseVariableId" integer, "templateVariableId" integer NOT NULL DEFAULT '0', "mappingResponseMappingId" integer NOT NULL, CONSTRAINT "PK_fdc92760b41e196b944dafb65d7" PRIMARY KEY ("responseVariableMappingId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_response_variable" ("variableId" SERIAL NOT NULL, "internalName" character varying NOT NULL DEFAULT '', "displayName" character varying NOT NULL DEFAULT '', "responseResponseId" integer NOT NULL, CONSTRAINT "PK_702711c6a7337ce2d7cb28c3b49" PRIMARY KEY ("variableId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_response" ("responseId" SERIAL NOT NULL, "internalName" character varying NOT NULL DEFAULT '', "displayName" character varying NOT NULL DEFAULT '', "description" character varying, "vendorVendorId" integer NOT NULL, CONSTRAINT "PK_4d5c57664d4a321a5d0d0812349" PRIMARY KEY ("responseId"))`);
        await queryRunner.query(`CREATE TABLE "vendor_response_template_mapping" ("responseMappingId" SERIAL NOT NULL, "name" character varying NOT NULL, "json" character varying, "responseResponseId" integer, "eventEventId" integer NOT NULL, "templateTemplateId" integer NOT NULL, CONSTRAINT "PK_caecf35da774cbcc0f1f54f7821" PRIMARY KEY ("responseMappingId"))`);
        await queryRunner.query(`CREATE TABLE "event" ("eventId" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_4ee8fd974a5681971c4eb5bb585" PRIMARY KEY ("eventId"))`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" ADD CONSTRAINT "FK_9bf1d4c6bbe927c8d35e5320c96" FOREIGN KEY ("requestVariableId") REFERENCES "vendor_request_variable"("variableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" ADD CONSTRAINT "FK_859f8be63796e2e2aa27943a68f" FOREIGN KEY ("mappingRequestMappingId") REFERENCES "vendor_request_template_mapping"("requestMappingId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" ADD CONSTRAINT "FK_9b3bd0ee4bbcf8b00f56d941c97" FOREIGN KEY ("responseVariableId") REFERENCES "vendor_response_variable"("variableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_request_variable" ADD CONSTRAINT "FK_11ec8995206e399b0c47d06d1e1" FOREIGN KEY ("requestRequestId") REFERENCES "vendor_request"("requestId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_request" ADD CONSTRAINT "FK_6f236591a131292af2506787286" FOREIGN KEY ("vendorVendorId") REFERENCES "vendor"("vendorId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" ADD CONSTRAINT "FK_e91883b5d59b2ba01bb483b4838" FOREIGN KEY ("requestRequestId") REFERENCES "vendor_request"("requestId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" ADD CONSTRAINT "FK_c8b4fca9bdf104391e8d1461c43" FOREIGN KEY ("eventEventId") REFERENCES "event"("eventId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" ADD CONSTRAINT "FK_69428fa9b66f5c7acda7097583a" FOREIGN KEY ("actionTemplateVariableId") REFERENCES "template_action"("templateVariableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD CONSTRAINT "FK_2ea2bac73beb348884573ac9c4a" FOREIGN KEY ("templateTemplateId") REFERENCES "adaptive_card_template"("templateId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_variable" ADD CONSTRAINT "FK_196c45dc467397b3f2beb98609e" FOREIGN KEY ("templateTemplateId") REFERENCES "adaptive_card_template"("templateId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" ADD CONSTRAINT "FK_51688df35284ce4627859e8bcba" FOREIGN KEY ("responseVariableId") REFERENCES "vendor_response_variable"("variableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" ADD CONSTRAINT "FK_e132e08c0a950d1932252935c5b" FOREIGN KEY ("mappingResponseMappingId") REFERENCES "vendor_response_template_mapping"("responseMappingId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" ADD CONSTRAINT "FK_5b332fe5496b9649767c8e0f981" FOREIGN KEY ("templateVariableId") REFERENCES "template_variable"("templateVariableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_response_variable" ADD CONSTRAINT "FK_9d9e4850873faaa6a21ef83fb57" FOREIGN KEY ("responseResponseId") REFERENCES "vendor_response"("responseId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_response" ADD CONSTRAINT "FK_c1e5886692a326dea44357233ed" FOREIGN KEY ("vendorVendorId") REFERENCES "vendor"("vendorId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" ADD CONSTRAINT "FK_f3d8fe8152766e735ac565ef505" FOREIGN KEY ("responseResponseId") REFERENCES "vendor_response"("responseId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" ADD CONSTRAINT "FK_d9b0b2afe6bd87701e0a78da34f" FOREIGN KEY ("eventEventId") REFERENCES "event"("eventId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" ADD CONSTRAINT "FK_f29b769f104674c4e534a0f67ad" FOREIGN KEY ("templateTemplateId") REFERENCES "adaptive_card_template"("templateId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" DROP CONSTRAINT "FK_f29b769f104674c4e534a0f67ad"`);
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" DROP CONSTRAINT "FK_d9b0b2afe6bd87701e0a78da34f"`);
        await queryRunner.query(`ALTER TABLE "vendor_response_template_mapping" DROP CONSTRAINT "FK_f3d8fe8152766e735ac565ef505"`);
        await queryRunner.query(`ALTER TABLE "vendor_response" DROP CONSTRAINT "FK_c1e5886692a326dea44357233ed"`);
        await queryRunner.query(`ALTER TABLE "vendor_response_variable" DROP CONSTRAINT "FK_9d9e4850873faaa6a21ef83fb57"`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" DROP CONSTRAINT "FK_5b332fe5496b9649767c8e0f981"`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" DROP CONSTRAINT "FK_e132e08c0a950d1932252935c5b"`);
        await queryRunner.query(`ALTER TABLE "response_variable_mapping" DROP CONSTRAINT "FK_51688df35284ce4627859e8bcba"`);
        await queryRunner.query(`ALTER TABLE "template_variable" DROP CONSTRAINT "FK_196c45dc467397b3f2beb98609e"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP CONSTRAINT "FK_2ea2bac73beb348884573ac9c4a"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" DROP CONSTRAINT "FK_69428fa9b66f5c7acda7097583a"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" DROP CONSTRAINT "FK_c8b4fca9bdf104391e8d1461c43"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" DROP CONSTRAINT "FK_e91883b5d59b2ba01bb483b4838"`);
        await queryRunner.query(`ALTER TABLE "vendor_request" DROP CONSTRAINT "FK_6f236591a131292af2506787286"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_variable" DROP CONSTRAINT "FK_11ec8995206e399b0c47d06d1e1"`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" DROP CONSTRAINT "FK_9b3bd0ee4bbcf8b00f56d941c97"`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" DROP CONSTRAINT "FK_859f8be63796e2e2aa27943a68f"`);
        await queryRunner.query(`ALTER TABLE "request_variable_mapping" DROP CONSTRAINT "FK_9bf1d4c6bbe927c8d35e5320c96"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "vendor_response_template_mapping"`);
        await queryRunner.query(`DROP TABLE "vendor_response"`);
        await queryRunner.query(`DROP TABLE "vendor_response_variable"`);
        await queryRunner.query(`DROP TABLE "response_variable_mapping"`);
        await queryRunner.query(`DROP TABLE "template_variable"`);
        await queryRunner.query(`DROP TABLE "adaptive_card_template"`);
        await queryRunner.query(`DROP TABLE "template_action"`);
        await queryRunner.query(`DROP TABLE "vendor_request_template_mapping"`);
        await queryRunner.query(`DROP TABLE "vendor_request"`);
        await queryRunner.query(`DROP TABLE "vendor"`);
        await queryRunner.query(`DROP TABLE "vendor_request_variable"`);
        await queryRunner.query(`DROP TABLE "request_variable_mapping"`);
    }

}
