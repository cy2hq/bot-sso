import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm"
import { adaptiveCardTemplate } from "./adaptiveCardTemplate";
import { responseVariableMapping } from "./responseVariableMapping";

@Entity()
export class templateVariable {
    @PrimaryGeneratedColumn()
    templateVariableId: number;

    @Column({ nullable: false })
    internalName: string;

    @Column({ nullable: false })
    displayName: string;

    @Column({ nullable: false, default: true })
    isRequired: boolean

    @Column({ nullable: false, default: "" })
    defaultValue: string

    @OneToMany(() => responseVariableMapping, (mapping) => mapping.templateVariable)
    mappings: responseVariableMapping[] | null;

    @ManyToOne(() => adaptiveCardTemplate, (template) => template.variables, { nullable: false })
    template: adaptiveCardTemplate;
}