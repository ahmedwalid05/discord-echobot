import { WebhookId } from ".";
import { EchobotOptions } from "./options.model";
export interface EchobotRedirect {
    

    sources: string[];
    
    destinations: WebhookId[];

    options?: EchobotOptions;

}