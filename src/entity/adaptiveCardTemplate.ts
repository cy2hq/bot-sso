import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { VendorResponseTemplateMapping } from "./vendorResponseTemplateMapping";
import { templateVariable } from "./templateVariable";
import { templateAction } from "./templateAction";

@Entity()
export class adaptiveCardTemplate {
    @PrimaryGeneratedColumn()
    templateId: number;

    @Column({ nullable: false })
    internalName: string;

    @Column({ nullable: false })
    displayName: string;

    @Column({ nullable: true })
    description: string | null;

    @Column({ nullable: false, default: false })
    isPublished: boolean

    @Column({ nullable: false, default: ""})
    templateString: string;

    @OneToMany(() => templateVariable, (variable) => variable.template, { nullable: false, eager: true })
    variables: templateVariable[];

    @OneToMany(() => templateAction, (action) => action.template, { nullable: false, eager: true })
    actions: templateAction[];

    @OneToMany(() => VendorResponseTemplateMapping, (mapping) => mapping.template)
    mappings: VendorResponseTemplateMapping[] | null;
}