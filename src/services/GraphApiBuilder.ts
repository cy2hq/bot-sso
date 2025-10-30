import { Client } from "@microsoft/microsoft-graph-client";

export class GraphApiBuilder {
    protected readonly graphClient: Client;

    constructor(ssoToken: string) {
        // Initialize the Microsoft Graph Client
        this.graphClient = Client.init({
            authProvider: (done) => {
                done(null, ssoToken);
            }
        });
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.graphClient.api(endpoint).get() as Promise<T>;
    }

    async post<T, B>(endpoint: string, content: B): Promise<T> {
        return this.graphClient.api(endpoint).post(content) as Promise<T>;
    }
}