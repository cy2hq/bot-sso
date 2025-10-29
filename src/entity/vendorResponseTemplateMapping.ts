import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm"
import { event } from './event'
import { vendorResponse } from "./vendorResponse";
import { adaptiveCardTemplate } from "./adaptiveCardTemplate";
import { responseVariableMapping } from "./responseVariableMapping";

@Entity()
export class VendorResponseTemplateMapping {
    @PrimaryGeneratedColumn()
    responseMappingId: number;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    json: string | null;

    @OneToMany(() => responseVariableMapping, (mapping) => mapping.mapping, { eager: true })
    variableMappings: responseVariableMapping[];

    @ManyToOne(() => vendorResponse, (response) => response.mappings, { eager: true })
    response: vendorResponse | null;

    @ManyToOne(() => event, (eventMapping) => eventMapping.eventId, { nullable: false })
    event: event;

    @ManyToOne(() => adaptiveCardTemplate, (template) => template.mappings, { nullable: false, eager: true })
    template: adaptiveCardTemplate;
}