import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { vendorResponseVariable } from "./vendorResponseVariable"
import { VendorResponseTemplateMapping } from "./vendorResponseTemplateMapping"
import { vendor } from "./vendor"

@Entity()
export class vendorResponse {
    @PrimaryGeneratedColumn()
    responseId: number;

    @Column({ nullable: false, default: '' })
    internalName: string;

    @Column({ nullable: false, default: '' })
    displayName: string;

    @Column({ nullable: true })
    description: string | null;

    @ManyToOne(() => vendor, (vendor) => vendor.responses, { nullable: false })
    vendor: vendor;

    @OneToMany(() => vendorResponseVariable, (variable) => variable.response, { eager: true })
    variables: vendorResponseVariable[] | null;

    @OneToMany(() => VendorResponseTemplateMapping, (mapping) => mapping.response)
    mappings: VendorResponseTemplateMapping[] | null;
}