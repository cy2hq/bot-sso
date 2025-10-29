import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { templateVariable } from "./templateVariable";
import { vendorResponseVariable } from "./vendorResponseVariable";
import { VendorResponseTemplateMapping } from "./vendorResponseTemplateMapping";

@Entity()
export class responseVariableMapping {
    @PrimaryGeneratedColumn()
    responseVariableMappingId: number;

    @Column({ nullable: false, default: false })
    combine: boolean;

    @Column({ nullable: true })
    name: string | null;

    @Column({ type: 'int', nullable: true })
    responseVariableId: number | null;

    @Column({ type: 'int', nullable: false, default: 0 })
    templateVariableId: number;

    @ManyToOne(() => vendorResponseVariable, (response) => response.mappings, { nullable: true })
    @JoinColumn({ name: 'responseVariableId' })
    responseVariable: vendorResponseVariable | null;

    @ManyToOne(() => VendorResponseTemplateMapping, (mapping) => mapping.variableMappings, { nullable: false })
    mapping: VendorResponseTemplateMapping;

    @ManyToOne(() => templateVariable, (template) => template.mappings, { nullable: false })
    @JoinColumn({ name: 'templateVariableId' })
    templateVariable: templateVariable;
}