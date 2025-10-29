import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { vendorRequestVariable } from "./vendorRequestVariable";
import { VendorRequestTemplateMapping } from "./vendorRequestTemplateMapping";
import { vendorResponseVariable } from "./vendorResponseVariable";

@Entity()
export class requestVariableMapping {
    @PrimaryGeneratedColumn()
    requestVariableMappingId: number;

    @Column({ nullable: false, default: false })
    combine: boolean;

    @Column({ nullable: true })
    name: string | null;

    @Column({ type: 'int', nullable: true })
    requestVariableId: number | null;

    @Column({ type: 'int', nullable: true })
    responseVariableId: number | null;

    @ManyToOne(() => vendorRequestVariable, (request) => request.mappings, { nullable: false })
    @JoinColumn({ name: 'requestVariableId' })
    requestVariable: vendorRequestVariable;

    @ManyToOne(() => VendorRequestTemplateMapping, (mapping) => mapping.variableMappings, { nullable: false })
    mapping: VendorRequestTemplateMapping;

    @ManyToOne(() => vendorResponseVariable, (responseVariable) => responseVariable.requestMappings, { nullable: true })
    @JoinColumn({ name: 'responseVariableId' })
    responseVariable: vendorResponseVariable | null;
}