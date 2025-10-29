import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedEventSummary1746703981946 implements MigrationInterface {
    name = 'AddedEventSummary1746703981946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ADD "summary" character varying NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "summary"`);
    }

}
