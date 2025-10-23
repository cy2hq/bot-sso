import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { VendorResponseTemplateMapping } from "./vendorResponseTemplateMapping"
import { VendorRequestTemplateMapping } from "./vendorRequestTemplateMapping"

@Entity()
export class event {
    @PrimaryGeneratedColumn()
    eventId: number

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false, default: '' })
    summary: string;

    @OneToMany(() => VendorResponseTemplateMapping, (responseMapping) => responseMapping.event, { eager: true })
    responseMappings: VendorResponseTemplateMapping[]

    @OneToMany(() => VendorRequestTemplateMapping, (requestMapping) => requestMapping.event, { eager: true })
    requestMappings: VendorRequestTemplateMapping[]
}