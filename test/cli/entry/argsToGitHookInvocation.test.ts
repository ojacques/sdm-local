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

import * as assert from "power-assert";

import {
    logger,
    LoggingConfig,
} from "@atomist/automation-client";
LoggingConfig.format = "cli";
(logger as any).level = process.env.LOG_LEVEL || "info";

import { argsToGitHookInvocation } from "../../../src/cli/entry/argsToGitHookInvocation";
import { WorkspaceContextResolver } from "../../../src/common/binding/WorkspaceContextResolver";

describe("argsToGitHookInvocation", () => {

    const tcr: WorkspaceContextResolver = {
        workspaceContext: {
            workspaceId: "AT0M1ST",
            workspaceName: "Atomist",
        },
    };

    it("should parse atomist-githook command line", () => {
        const a = ["node", "atomist-githook", "event", "dir/ectory", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "dir/ectory");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should parse 'atomist git-hook' command line", () => {
        const a = ["node", "atomist", "git-hook", "event", "dir/ectory", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "dir/ectory");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing forward slash from directory", () => {
        const a = ["node", "atomist-githook", "event", "/path/to/project/", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing forward slash from 'atomist git-hook' directory", () => {
        const a = ["node", "atomist", "git-hook", "event", "/path/to/project/", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing .git from directory", () => {
        const a = ["node", "atomist-githook", "event", "/path/to/project/.git", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing .git/ from directory", () => {
        const a = ["node", "atomist", "git-hook", "event", "/path/to/project/.git/", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing .git/hooks from directory", () => {
        const a = ["node", "atomist", "git-hook", "event", "/path/to/project/.git/hooks", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip trailing .git/hooks/ from directory", () => {
        const a = ["node", "atomist-githook", "event", "/path/to/project/.git/hooks/", "branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "/path/to/project");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip refs/heads/ from branch", () => {
        const a = ["node", "atomist-githook", "event", "dir/ectory", "refs/heads/branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "dir/ectory");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

    it("should strip refs/heads/ from 'atomist git-hook' branch", () => {
        const a = ["node", "atomist", "git-hook", "event", "dir/ectory", "refs/heads/branch", "sha"];
        const i = argsToGitHookInvocation(a, tcr);
        assert.strictEqual(i.event, "event");
        assert.strictEqual(i.baseDir, "dir/ectory");
        assert.strictEqual(i.branch, "branch");
        assert.strictEqual(i.sha, "sha");
        assert.strictEqual(i.workspaceId, tcr.workspaceContext.workspaceId);
    });

});
