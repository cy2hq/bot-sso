import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { vendorRequest } from "./vendorRequest";
import { requestVariableMapping } from "./requestVariableMapping";

@Entity()
export class vendorRequestVariable {
    @PrimaryGeneratedColumn()
    variableId: number;

    @Column({ nullable: false, default: '' })
    internalName: string;

    @Column({ nullable: false, default: '' })
    displayName: string;

    @Column({ nullable: false, default: true })
    isRequired: boolean

    @ManyToOne(() => vendorRequest, (request) => request.variables, { nullable: false })
    request: vendorRequest;

    @OneToMany(() => requestVariableMapping, (mapping) => mapping.requestVariable, { nullable: true })
    mappings: requestVariableMapping[] | null;
}