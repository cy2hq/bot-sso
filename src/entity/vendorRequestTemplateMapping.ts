import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm"
import { event } from './event'
import { vendorRequest } from "./vendorRequest";
import { requestVariableMapping } from "./requestVariableMapping";
import { templateAction } from "./templateAction";

@Entity()
export class VendorRequestTemplateMapping {
    @PrimaryGeneratedColumn()
    requestMappingId: number;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    json: string | null;

    @OneToMany(() => requestVariableMapping, (mapping) => mapping.mapping, { nullable: false, eager: true })
    variableMappings: requestVariableMapping[];

    @ManyToOne(() => vendorRequest, (request) => request.mappings, { nullable: false, eager: true })
    request: vendorRequest;

    @ManyToOne(() => event, (eventMapping) => eventMapping.eventId, { nullable: false })
    event: event;

    @ManyToOne(() => templateAction, (action) => action.mappings, { nullable: false, eager: true })
    action: templateAction;
}