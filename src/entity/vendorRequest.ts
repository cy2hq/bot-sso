import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { vendorRequestVariable } from "./vendorRequestVariable"
import { VendorRequestTemplateMapping } from "./vendorRequestTemplateMapping"
import { vendor } from "./vendor";

@Entity()
export class vendorRequest {
    @PrimaryGeneratedColumn()
    requestId: number;

    @Column({ nullable: false, default: '' })
    internalName: string;

    @Column({ nullable: false, default: '' })
    displayName: string;

    @Column({ nullable: true })
    description: string | null;

    @Column({ nullable: false, default: '' })
    endpoint: string;

    @ManyToOne(() => vendor, (vendor) => vendor.requests, { nullable: false, eager: true })
    vendor: vendor;

    @OneToMany(() => vendorRequestVariable, (variable) => variable.request, { eager: true })
    variables: vendorRequestVariable[] | null;

    @OneToMany(() => VendorRequestTemplateMapping, (mapping) => mapping.request)
    mappings: VendorRequestTemplateMapping[] | null;
}