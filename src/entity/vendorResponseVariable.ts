import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { vendorResponse } from "./vendorResponse";
import { responseVariableMapping } from "./responseVariableMapping";
import { requestVariableMapping } from "./requestVariableMapping";

@Entity()
export class vendorResponseVariable {
    @PrimaryGeneratedColumn()
    variableId: number;

    @Column({ nullable: false, default: '' })
    internalName: string;

    @Column({ nullable: false, default: '' })
    displayName: string;

    @ManyToOne(() => vendorResponse, (response) => response.variables, { nullable: false })
    response: vendorResponse;

    @OneToMany(() => responseVariableMapping, (mapping) => mapping.responseVariable, { nullable: true })
    mappings: responseVariableMapping[] | null;

    @OneToMany(() => requestVariableMapping, (mapping) => mapping.responseVariable, { nullable: true })
    requestMappings: requestVariableMapping[] | null;
}