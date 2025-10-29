import * as ACData from "adaptivecards-templating";

import { AppDataSource } from "../internal/data-source";
import { event } from "../entity/event";
import { adaptiveCardTemplate } from "../entity/adaptiveCardTemplate";
import { vendorResponse } from "../entity/vendorResponse";
import { VendorResponseTemplateMapping } from "../entity/vendorResponseTemplateMapping";
import { VendorRequestTemplateMapping } from "../entity/vendorRequestTemplateMapping";
import { requestVariableMapping } from "../entity/requestVariableMapping";
import { vendorRequestVariable } from "../entity/vendorRequestVariable";
import { vendorRequest } from "../entity/vendorRequest";


export class AdaptiveCardBuilder {
    private readonly eventData: event | null = null;
    private templateValues: { [key: string]: string } = {};

    private constructor(eventData: event) {
        this.eventData = eventData
    }

    public getSummary(): string | null {
        if (this.eventData == null) {
            return null
        }
        return this.eventData.summary;
    }

    /**
    * Initializes the Adaptive Card builder.
    *
    * @remarks
    * This method must be called before the build function can be used.
    *
    * @param eventId - The unique identifier of the event that has been triggered.
    * @returns An adaptiveCardBuilder object if initialization was successfull. Otherwise, null is returned.
    */
    public static async init(
        eventId: number
    ): Promise<AdaptiveCardBuilder | null> {
        const data = await AppDataSource.getRepository(event).count();
        console.log(`Total events in database: ${data}`);

        const events = await AppDataSource
            .getRepository(event)
            .find({
                where: {
                    eventId: eventId
                }
            });

        if (events.length == 0) {
            console.log('No event data found!');
            return null;
        }
        return new AdaptiveCardBuilder(events[0])
    }


    /**
    * Builds an Adaptive Card based on the provided event data.
    *
    * @remarks
    * The {@link AdaptiveCardBuilder} object must be initialized 
    * before this function can be called.
    *
    * @param response - The JSON formatted body content of the 
    * response sent by the vendor.
    * 
    * @returns An {@link ACData.Template} if the build was 
    * successfull. Otherwise, null returned.
    */
    public async build(
        response: string
    ): Promise<ACData.Template | null> {
        if (this.eventData == null) {
            console.log('No event data found!');
            return null;
        }

        this.eventData.responseMappings.forEach(mapping => {
            const responseVariables = this.extractResponseVariables(
                mapping,
                response
            )
            const variableMappings = this.mapResponseVariables(
                mapping,
                responseVariables
            )
            this.insertTemplateVariables(
                mapping.template,
                variableMappings
            )
        })

        //const test = '{"$schema":"https://adaptivecards.io/schemas/adaptive-card.json","type":"AdaptiveCard","version":"1.5","body":[{"type":"Container","items":[{"type":"ColumnSet","columns":[{"type":"Column","width":"auto","items":[{"type":"Image","url":"${image}","size":"Medium","style":"Person","altText":"TeachersProfilePhoto"}]},{"type":"Column","width":"stretch","items":[{"type":"TextBlock","text":"${title}","weight":"Bolder","size":"Large","spacing":"Medium"},{"type":"TextBlock","text":"${subtitle}","isSubtle":true,"wrap":true}]}]},{"type":"TextBlock","text":"${subjectText0}","weight":"Bolder","wrap":true,"spacing":"Medium"},{"type":"TextBlock","text":"${subjectText1}","wrap":true},{"type":"ActionSet","actions":[{"type":"Action.ShowCard","title":"${showContentButtonText}","card":{"type":"AdaptiveCard","body":[{"type":"TextBlock","text":"${messageText0}","weight":"Bolder","wrap":true,"spacing":"Medium"},{"type":"Input.Text","id":"studentFeedback","placeholder":"Typeyourmessagehere...","isMultiline":true}],"actions":[{"type":"Action.Submit","title":"${actionButtonText0}","data":{"action":"sendResponse"}}]}},{"type":"Action.OpenUrl","title":"${actionButtonText1}","url":"${assignmentUrl}"}]},{"type":"Container","items":[{"type":"TextBlock","text":"[NeedHelp?](${helpLinkUrl})","weight":"Lighter","size":"Small","horizontalAlignment":"Right","color":"Accent","isSubtle":true,"wrap":true,"spacing":"Medium"}]}]}]}'
        //console.log(this.eventData.responseMappings[0].template.templateString);

        try {
            const template = JSON.parse(this.eventData.responseMappings[0].template.templateString);
            return new ACData.Template(template).expand({ $root: this.templateValues });
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    /**
    * Rebuilds the Adaptive Card to include the action URL's for
    * each follow-up action button button.
    *
    * @remarks
    * The {@link AdaptiveCardBuilder} object must be initialized 
    * and the {@link AdaptiveCardBuilder.build} function must have
    * been performed before this function can be called.
    *
    * @param response - The JSON formatted body content of the 
    * response sent by the vendor.
    * @param messageId - The unique identifier of the message
    * in which the Adaptive Card lives. This value is be used
    * to update the specified message with new cards.
    * @param conversationId - The unique identifier of this
    * conversation. This value may be used to retrieve the
    * conversation this message belongs to.
    * 
    * @returns An {@link ACData.Template} to replace the original
    * message if successfull. Otherwise, null returned.
    */
    public async buildActions(
        response: string,
        messageId: string,
        conversationId: string
    ): Promise<ACData.Template | null> {
        for (var i = 0; i < 5; i++) {
            console.log('')
        }
        console.log('Mapping request URL\'s to buttons!');

        if (this.eventData == null) {
            console.log('No event data found!');
            return null;
        }

        const responseMapping = this.eventData.responseMappings.find(mapping =>
            mapping.response != null
        )
        if (responseMapping == null) {
            return;
        }

        var responseVariables: { [key: string]: string } = {}
        this.extractVendorResponseVariables(
            responseMapping.response,
            response,
            responseVariables
        )

        this.eventData.requestMappings.forEach(mapping => {
            const variableMappingValues = this.extractActionVariables(
                mapping,
                responseVariables,
                messageId,
                conversationId
            )
            const requestVariableValues = this.mapRequestVariable(
                mapping,
                variableMappingValues
            )
            const actionUrl = this.insertRequestVariable(
                mapping.request,
                requestVariableValues
            )
            console.log(mapping.request.endpoint);
            this.templateValues[`${mapping.action.internalName}_url`] = actionUrl
            this.templateValues[`${mapping.action.internalName}_action`] = mapping.action.actionType
        })

        try {
            const template = JSON.parse(this.eventData.responseMappings[0].template.templateString)
            return new ACData.Template(template).expand({ $root: this.templateValues });
        } catch (err) {
            console.log(err);
            return null;
        }
    }







    // #region Response variable extraction

    /**
    * Extracts all response values, and maps each one to a 
    * {@link responseVariableMapping}.
    *
    * @param variableMapping - The response mapping object to 
    * extract the response values from.
    * @param response - The JSON formatted body content of the 
    * response sent by the vendor.
    * 
    * @returns An array of key-value pairs, where the key
    * represents the unique identifier of the {@link vendorResponseVariable} 
    * object, and the value represents the assigned response
    * value.
    */
    private extractResponseVariables(
        variableMapping: VendorResponseTemplateMapping,
        response: string
    ): { [key: number]: string } {
        var responseValues: { [key: string]: string } = {};
        if (variableMapping.response != null) {
            this.extractVendorResponseVariables(variableMapping.response, response, responseValues)
        }
        this.extractLocalResponseVariables(variableMapping, responseValues)
        return responseValues;
    }

    /**
    * Extracts the variables from the JSON formatted response
    * body. Each variable is then assigned to one of the 
    * {@link vendorResponseVariable} from the {@link vendorResponse} 
    * linked to this event.
    *
    * @remarks
    * This function should only be called if the {@link vendorRequestTemplateMapping}
    * object is linked to a {@link vendorResponse}.
    * 
    * @param variableMapping - The response mapping object to 
    * which the {@link vendorResponse} is linked.
    * @param response - The JSON formatted body content of the 
    * response sent by the vendor.
    * @param responseValues - The array of key-value pairs in
    * which the resulting mappings are stored.
    */
    private extractVendorResponseVariables(
        responseStructure: vendorResponse,
        responseBody: string,
        responseValues: { [key: string]: string }
    ) {
        console.log('Started response JSON parsing!')
        const responseObject = JSON.parse(responseBody);
        if (responseObject == null) {
            return;
        }

        responseStructure.variables.forEach(function (variable) {
            responseValues[String(variable.variableId)] = String(responseObject[variable.internalName]) ?? '';
        })
        console.log('Finished response JSON parsing!')
    }

    /**
    * Extracts the variables stored in the `json` property of the
    * {@link vendorResponseTemplateMapping} object. Each variable
    * is then mapped to a {@link responseVariableMapping} object
    * using its `name` property.
    * 
    * @param variableMapping - The response mapping object to 
    * which all {@link responseVariableMapping} obects are linked.
    * @param responseValues - The array of key-value pairs in
    * which the resulting mappings are stored.
    */
    private extractLocalResponseVariables(
        variableMapping: VendorResponseTemplateMapping,
        responseValues: { [key: string]: string }
    ) {
        console.log('Started local JSON parsing!')
        if (variableMapping.json == null) {
            return;
        } else if (variableMapping.json.length == 0) {
            return;
        }

        const localObject = JSON.parse(variableMapping.json)
        variableMapping.variableMappings.forEach(function (mapping) {
            const localObjectValue = localObject[mapping.name]
            if (localObjectValue != null) {
                responseValues[mapping.name] = localObjectValue;
            }
        })
        console.log('Finished local JSON parsing!')
    }

    // #endregion





    // #region Response variable mapping

    /**
    * Maps all values extracted using the {@link AdaptiveCardBuilder.extractResponseVariables}
    * function to the {@link templateVariable} linked to each {@link responseVariableMapping}.
    * 
    * @param variableMapping - The response mapping object to 
    * which all {@link responseVariableMapping} obects are linked.
    * @param responseValues - The array of key-value pairs in
    * which the response mappings outputted by the 
    * {@link AdaptiveCardBuilder.extractResponseVariables} function are stored.
    * 
    * @returns An array of key-value pairs, where the key
    * represents the unique identifier of the {@link templateVariable} 
    * object, and the value represents the assigned response
    * value. Returns null if unsuccessfull.
    */
    private mapResponseVariables(
        variableMapping: VendorResponseTemplateMapping,
        responseValues: { [key: string]: string }
    ): { [key: number]: string } | null {
        console.log('Started mapping variables!')
        var adaptiveCardValues: { [key: string]: string } = {};
        variableMapping.variableMappings.forEach(function (mapping) {
            // Validate mapping points to a value.
            if (mapping.responseVariableId == null && mapping.name == null) {
                console.log('Invalid or corrupted variable mapping. Continuing...');
                return;
            }

            // Validate value for this mapping exists.
            var value = null;
            if (mapping.responseVariableId != null) {
                value = responseValues[mapping.responseVariableId];
            } else if (mapping.name != null) {
                value = responseValues[mapping.name];
            }
            if (value == null) {
                console.log('Mapping with missing value. Continuing...');
                return;
            }

            // Insert response value into local value.
            if (mapping.combine && mapping.responseVariableId != null) {
                const base = responseValues[mapping.name];
                value = base.replace('${0}', value)
                console.log('Value inserted successfully!')
            }

            // Map value to template variable
            if (value != null) {
                adaptiveCardValues[mapping.templateVariableId] = value;
                console.log('Value mapped successfully!')
            }
        })
        console.log('Finished mapping variables!')
        return adaptiveCardValues;
    }

    // #endregion





    // #region Response variable insertion

    /**
    * Inserts all values mapped using the {@link AdaptiveCardBuilder.extractResponseVariables}
    * function into the {@link templateValues} array. These values 
    * can then be injected into the `templateJson` property of the
    * {@link adaptiveCardTemplate} object.
    * 
    * @param cardTemplate - The {@link adaptiveCardTemplate} to which
    * the values will be linked.
    * @param adaptiveCardValues - The array of key-value pairs in
    * which the adaptive card variable mappings outputted by the 
    * {@link AdaptiveCardBuilder.mapResponseVariables} function are stored.
    */
    private insertTemplateVariables(
        cardTemplate: adaptiveCardTemplate,
        adaptiveCardValues: { [key: number]: string }
    ) {
        console.log('Started inserting variables!')
        cardTemplate.variables.forEach(variable => {
            const value = adaptiveCardValues[variable.templateVariableId]
            if (value != null) {
                this.templateValues[variable.internalName] = value;
            }
        })
        console.log('Finished inserting variables!')
    }

    // #endregion










    // #region Request variable extraction

    /**
    * Extracts the values used in the follow-up action URL linked to the {@link templateAction}.
    *
    * @param response - The JSON formatted body content of the 
    * response sent by the vendor.
    * @param messageId - The unique identifier of the message
    * in which the Adaptive Card lives.
    * @param conversationId - The unique identifier of the
    * conversation in which the message was sent.
    * 
    * @returns An array of key-value pairs, where the key
    * represents the unique identifier of the {@link requestVariableMapping} 
    * object, and the value represents the assigned request
    * value.
    */
    private extractActionVariables(
        mapping: VendorRequestTemplateMapping,
        responseVariables: { [key: string]: string },
        messageId: string,
        conversationId: string
    ): { [key: number]: string } {
        console.log('Started response JSON parsing!')
        var variableMappingValues: { [key: string]: string } = {};

        const localVariables = this.parseLocalJson(mapping);
        if (localVariables != null) {
            this.extractLocalActionVariable(mapping, variableMappingValues, localVariables, messageId, conversationId);
        }
        this.extractResponseActionVariable(mapping, variableMappingValues, responseVariables)

        console.log('Finished response JSON parsing!')
        return variableMappingValues;
    }

    /**
    * Extracts the request values mapped to {@link vendorResponseVariable}
    * objects, and maps each to a {@link requestVariableMapping} object.
    *
    * @param mapping - The {@link vendorRequestTemplateMapping}
    * object, containing the {@link requestVariableMapping} objects
    * to which the values will be mapped.
    * @param variableMappingValues - The array of key-value pairs in
    * which the resulting mappings are stored.
    * @param responseVariables - The array of key-value pairs in
    * which the values mapped to {@link vendorResponseVariable} objects
    * are stored.
    */
    private extractResponseActionVariable(
        mapping: VendorRequestTemplateMapping,
        variableMappingValues: { [key: string]: string },
        responseVariables: { [key: string]: string }
    ) {
        const responseMappings = mapping.variableMappings.filter(mapping =>
            mapping.responseVariableId != null
        )

        responseMappings.forEach(function (mapping) {
            const responseVariable = responseVariables[String(mapping.responseVariableId)]
            if (responseVariable == null) {
                return;
            }
            variableMappingValues[String(mapping.responseVariableId)] = responseVariable;
        })
    }

    /**
    * Extracts the request values stored in the `json` property
    * of the {@link vendorRequestTemplateMapping} object, and maps 
    * each to a {@link requestVariableMapping} object.
    *
    * @param mapping - The {@link vendorRequestTemplateMapping}
    * object, containing the {@link requestVariableMapping} objects
    * to which the values will be mapped.
    * @param variableMappingValues - The array of key-value pairs in
    * which the resulting mappings are stored.
    * @param localVariables - The local request variables retrieved
    * using the {@link AdaptiveCardBuilder.parseLocalJson} function.
    * @param messageId - The unique identifier of the message
    * in which the Adaptive Card lives.
    * @param conversationId - The unique identifier of this
    * conversation.
    */
    private extractLocalActionVariable(
        mapping: VendorRequestTemplateMapping,
        variableMappingValues: { [key: string]: string },
        localVariables: any,
        messageId: string,
        conversationId: string
    ) {
        const localMappings = mapping.variableMappings.filter(mapping =>
            mapping.responseVariableId == null &&
            mapping.name != null
        )
        localMappings.forEach(function (mapping) {
            // Inject the provided messageId and conversationId values if present.
            if (mapping.name == 'message_id') {
                variableMappingValues['message_id'] = messageId;
                return;
            } else if (mapping.name == 'conversation_id') {
                variableMappingValues['conversation_id'] = conversationId;
                return;
            }

            const localVariable = localVariables[mapping.name]
            if (localVariable != null) {
                variableMappingValues[mapping.name] = localVariable;
            }
        })
        console.log('Finished local JSON parsing!')
    }

    /**
    * Parses the local request values stored in the `json` property 
    * of the {@link vendorRequestTemplateMapping} object.
    *
    * @param mapping - The {@link vendorRequestTemplateMapping}
    * object from which the `json` property will be parsed.
    * 
    * @returns The parsed JSON object containing local request
    * values. If unsuccessfull, null is returned.
    */
    private parseLocalJson(
        mapping: VendorRequestTemplateMapping
    ): any | null {
        console.log('Started local JSON parsing!')
        if (mapping.json == null) {
            return;
        } else if (mapping.json.length == 0) {
            return;
        }

        var localVariables: any | null = null;
        try {
            localVariables = JSON.parse(mapping.json)
        } catch (err) {
            console.log(`Parsing JSON failed: ${err}`)
        }
        console.log('Finished local JSON parsing!')
        return localVariables
    }

    // #endregion





    // #region Request variable mapping

    /**
    * Maps the request values extracted using the 
    * {@link AdaptiveCardBuilder.extractActionVariables} function, 
    * to the assigned {@link vendorRequestVariable} object.
    *
    * @param mapping - The {@link VendorRequestTemplateMapping} to which
    * the {@link requestVariableMapping} objects are linked.
    * @param variableMappingValues - The array containing key-value
    * pairs, where the key represents the unique identifier of the
    * {@link requestVariableMapping} object, and the value represents
    * the mapped value.
    * 
    * @returns An array of key-value pairs, where the key
    * represents the unique identifier of the {@link vendorRequestVariable} 
    * object, and the value represents the assigned request
    * value.
    */
    private mapRequestVariable(
        mapping: VendorRequestTemplateMapping,
        variableMappingValues: { [key: string]: string }
    ): { [key: number]: string } | null {
        console.log('Started mapping variables!')
        var requestVariableValues: { [key: string]: string } = {};
        mapping.variableMappings.forEach(variableMapping => {
            if (variableMapping.responseVariableId == null && variableMapping.name == null) {
                console.log('Invalid or corrupted variable mapping. Continuing...');
                return;
            }

            var value = this.getRequestMappingValue(
                variableMapping,
                variableMappingValues
            );
            if (value != null) {
                requestVariableValues[variableMapping.requestVariableId] = value;
                console.log('Value mapped successfully!');
            }
        })
        console.log('Finished mapping variables!')
        return requestVariableValues;
    }

    /**
    * Retrieves the value assigned to the {@link requestVariableMapping}
    * object from the array of mappings created using the
    * {@link AdaptiveCardBuilder.extractActionVariables} function.
    *
    * @param mapping - The {@link requstVariableMapping} object for
    * which the value will be retrieved.
    * @param variableMappingValues - The array containing key-value
    * pairs, where the key represents the unique identifier of the
    * {@link requestVariableMapping} object, and the value represents
    * the mapped value.
    * 
    * @returns The value assigned to the {@link requestVariableMapping}
    * object. If unsuccessfull, null is returned.
    */
    private getRequestMappingValue(
        mapping: requestVariableMapping,
        variableMappingValues: { [key: string]: string }
    ): string | null {
        var value = null;
        if (mapping.responseVariableId != null) {
            value = variableMappingValues[mapping.responseVariableId];
        } else if (mapping.name != null) {
            value = variableMappingValues[mapping.name];
        }
        if (value == null) {
            console.log('Mapping with missing value. Skipping...');
            return;
        }

        if (mapping.combine && mapping.responseVariableId != null) {
            const base = variableMappingValues[mapping.name];
            value = base.replace('${0}', value);
            console.log('Value inserted successfully!');
        }
        return value;
    }

    // #endregion





    // #region Request variable insertion

    /**
    * Inserts the request values mapped using the 
    * {@link AdaptiveCardBuilder.extractActionVariables} function
    * into the follow-up action URL.
    *
    * @param request - The {@link vendorRequest} object to which
    * the {@link vendorRequestVariables} objects to be inserted
    * into the URL are linked.
    * @param requestVariableValues - The array containing key-value
    * pairs, where the key represents the unique identifier of the
    * {@link requestVariableMapping} object, and the value represents
    * the mapped value.
    * 
    * @returns A string containing the complete vendor URL, in which
    * all mapped values have been inserted. If unsuccessfull, returns
    * null instead.
    */
    private insertRequestVariable(
        request: vendorRequest,
        requestVariableValues: { [key: number]: string }
    ): string | null {
        console.log('Started inserting variables!')

        // Determine all path variables
        const pathVariableNames = this.getPathVariables(request.endpoint);
        const pathVariables = request.variables.filter(variable =>
            pathVariableNames.includes(variable.internalName)
        );

        // Verify all path variables are present
        if (pathVariables.length != pathVariableNames.length) {
            return null;
        }
        // Determine all query parameters
        const queryParameters = request.variables.filter(variable =>
            !pathVariables.includes(variable)
        );

        // Build complete URL
        var url = request.vendor.url
        url += this.insertPathVariables(
            pathVariables,
            requestVariableValues,
            request.endpoint
        )
        url += this.insertQueryVariables(
            queryParameters,
            requestVariableValues
        )
        console.log('Finished inserting variables!')
        console.log(url);
        return url
    }

    /**
    * Inserts the values of the path variables retrieved using the
    * {@link AdaptiveCardBuilder.getPathVariables} function into the
    * provided endpoint URL.
    *
    * @param queryParameters - The array containing all 
    * {@link vendorRequestVariable} objects of which the mapped value
    * will be inserted as a path variable.
    * @param requestVariableValues - The array containing key-value
    * pairs, where the key represents the unique identifier of the
    * {@link requestVariableMapping} object, and the value represents
    * the mapped value.
    * @param url - The url in which the path variables will be
    * inserted.
    * 
    * @returns An array of key-value pairs, where the key
    * represents the unique identifier of the {@link vendorRequestVariable} 
    * object, and the value represents the assigned request
    * value.
    */
    private insertPathVariables(
        pathVariables: vendorRequestVariable[],
        requestVariableValues: { [key: number]: string },
        url: string
    ): string {
        var result = url
        pathVariables.forEach(function (variable) {
            const value = requestVariableValues[variable.variableId];
            if (value != null) {
                result = result.replace(`\${${variable.internalName}}`, value);
            }
        })
        return result
    }

    /**
    * Creates a string of query parameters that can be appended to the
    * end of a URL.
    *
    * @param queryParameters - The array containing all 
    * {@link vendorRequestVariable} objects to be included as query
    * parameters.
    * @param requestVariableValues - The array containing key-value
    * pairs, where the key represents the unique identifier of the
    * {@link requestVariableMapping} object, and the value represents
    * the mapped value.
    * 
    * @returns A query string containing all {@link vendorRequestVariable}
    * objects for which a value was found. If no values were found,
    * an empty string is returned instead.
    */
    private insertQueryVariables(
        queryParameters: vendorRequestVariable[],
        requestVariableValues: { [key: number]: string }
    ): string {
        var query = '?'
        queryParameters.forEach(function (variable) {
            const value = requestVariableValues[variable.variableId];
            if (value != null) {
                query += `${query.length > 1 ? "&" : ""}${variable.internalName}=${value}`
            }
        })
        return query.length == 1 ? '' : query
    }

    /**
    * Parses the provided endpoint url to determine the path variables
    * that need to be inserted.
    *
    * @param url - The endpoint url to be parsed.
    * 
    * @returns an array of strings, where each entry represents the
    * `name` property of the {@link vendorResponseVariable} object from
    * which the linked value will be inserted.
    */
    private getPathVariables(
        url: string
    ): string[] {
        var urlParameters: string[] = []
        console.log(url);

        var searchIndex = 0;
        var arrayIndex = 0;
        while (searchIndex < url.length) {
            if (!url.includes('${', searchIndex)) {
                searchIndex = url.length;
                return;
            }
            const parameterIndex = url.indexOf('${', searchIndex);

            if (!url.includes('}', parameterIndex)) {
                searchIndex = url.length;
                return;
            }
            const parameterEndIndex = url.indexOf('}', searchIndex)

            urlParameters[arrayIndex++] = url.slice(parameterIndex + 2, parameterEndIndex)
            searchIndex = parameterEndIndex + 1;
        }
        console.log(urlParameters);
        return urlParameters;
    }

    // #endregion
}