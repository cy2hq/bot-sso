import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { vendorRequest } from "./vendorRequest";
import { vendorResponse } from "./vendorResponse";

@Entity()
export class vendor {
    @PrimaryGeneratedColumn()
    vendorId: number

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    url: string;

    @OneToMany(() => vendorRequest, (request) => request.vendor, { eager: false })
    requests: vendorRequest[]

    @OneToMany(() => vendorResponse, (response) => response.vendor, { eager: false })
    responses: vendorResponse[]
}