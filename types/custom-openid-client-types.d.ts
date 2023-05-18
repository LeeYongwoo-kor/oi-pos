import { TokenSetParameters as OriginalTokenSetParameters } from "openid-client/types/index";

declare module "openid-client" {
  export interface TokenSetParameters extends OriginalTokenSetParameters {
    [key: string]: number | string | undefined;
    expires_in?: number;
  }
}
