
/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MappedParameterDeclaration } from "@atomist/automation-client/metadata/automationMetadata";
import { MappedParameterResolver } from "./MappedParameterResolver";

/**
 * Whatever arguments they provided on the command line, find mapped parameters in them
 * first resolution
 */
export class ExtraParametersMappedParameterResolver implements MappedParameterResolver {

    private args: Array<{ name: string, value: string }>;

    public resolve(md: MappedParameterDeclaration): string | undefined {
        process.stdout.write("Looking for: " + md.name);
        process.stdout.write("have: " + this.args.map(d => d.name).join(", "));
        const found = this.args.find(n => n.name === md.name);
        return found ? found.value : undefined;
    }

    constructor(args: any) {
        this.args = args;
    }
}
