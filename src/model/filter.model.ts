
import { EchobotRedirect } from "./redirect.model";
export interface EchobotFilter {
    

    redirect?: EchobotRedirect;

    words?: string[];
    removeQuote? : boolean;

}