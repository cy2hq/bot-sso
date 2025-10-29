import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { adaptiveCardTemplate } from "./adaptiveCardTemplate";
import { VendorRequestTemplateMapping } from "./vendorRequestTemplateMapping";

@Entity()
export class templateAction {
    @PrimaryGeneratedColumn()
    templateActionId: number;

    @Column({ nullable: false })
    internalName: string;

    @Column({ nullable: false })
    displayName: string;

    @Column({ nullable: false, default: "Action.OpenUrl" })
    actionType: string

    @OneToMany(() => VendorRequestTemplateMapping, (mapping) => mapping.action)
    mappings: VendorRequestTemplateMapping[] | null;

    @ManyToOne(() => adaptiveCardTemplate, (template) => template.actions, { nullable: false })
    template: adaptiveCardTemplate;
}