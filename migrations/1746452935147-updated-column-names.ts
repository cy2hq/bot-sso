import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedColumnNames1746452935147 implements MigrationInterface {
    name = 'UpdatedColumnNames1746452935147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" DROP CONSTRAINT "FK_69428fa9b66f5c7acda7097583a"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" RENAME COLUMN "actionTemplateVariableId" TO "actionTemplateActionId"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_variable" DROP COLUMN "urlPathIndex"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP CONSTRAINT "PK_f0bc515b0912d3ab57cdade7a6d"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP COLUMN "templateVariableId"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP COLUMN "defaultUrl"`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD "templateActionId" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD CONSTRAINT "PK_071249464d69aba5995c628f931" PRIMARY KEY ("templateActionId")`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD "actionType" character varying NOT NULL DEFAULT 'Action.OpenUrl'`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" ADD CONSTRAINT "FK_f406088cd345178e50f1958ad22" FOREIGN KEY ("actionTemplateActionId") REFERENCES "template_action"("templateActionId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" DROP CONSTRAINT "FK_f406088cd345178e50f1958ad22"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP COLUMN "actionType"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP CONSTRAINT "PK_071249464d69aba5995c628f931"`);
        await queryRunner.query(`ALTER TABLE "template_action" DROP COLUMN "templateActionId"`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD "defaultUrl" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD "templateVariableId" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "template_action" ADD CONSTRAINT "PK_f0bc515b0912d3ab57cdade7a6d" PRIMARY KEY ("templateVariableId")`);
        await queryRunner.query(`ALTER TABLE "vendor_request_variable" ADD "urlPathIndex" integer`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" RENAME COLUMN "actionTemplateActionId" TO "actionTemplateVariableId"`);
        await queryRunner.query(`ALTER TABLE "vendor_request_template_mapping" ADD CONSTRAINT "FK_69428fa9b66f5c7acda7097583a" FOREIGN KEY ("actionTemplateVariableId") REFERENCES "template_action"("templateVariableId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
