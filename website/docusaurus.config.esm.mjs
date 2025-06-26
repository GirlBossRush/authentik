/**
 * @file Docusaurus config.
 *
 * @import { Config } from "@docusaurus/types";
 * @import { UserThemeConfig, UserThemeConfigExtra } from "@goauthentik/docusaurus-config";
 * @import { Options as DocsPluginOptions } from "@docusaurus/plugin-content-docs";
 * @import * as OpenApiPlugin from "docusaurus-plugin-openapi-docs";
 * @import { BuildUrlValues } from "remark-github";
 * @import { ReleasesPluginOptions } from "./releases/plugin.mjs"
 */
import { createDocusaurusConfig } from "@goauthentik/docusaurus-config";

import remarkNPM2Yarn from "@docusaurus/remark-plugin-npm2yarn";
import { GlobExcludeDefault } from "@docusaurus/utils";
import { createApiPageMD } from "docusaurus-plugin-openapi-docs/lib/markdown/index.js";
import { cp } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzip } from "pako";
import remarkDirective from "remark-directive";
import remarkGithub, { defaultBuildUrl } from "remark-github";

import {
    remarkEnterpriseDirective,
    remarkLinkRewrite,
    remarkPreviewDirective,
    remarkSupportDirective,
    remarkVersionDirective,
} from "./remark/index.mjs";

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const staticDirectory = resolve(__dirname, "static");

//#region Copy static files

const authentikModulePath = resolve("..");

await Promise.all([
    cp(
        resolve(authentikModulePath, "docker-compose.yml"),
        resolve(staticDirectory, "docker-compose.yml"),
    ),
    cp(resolve(authentikModulePath, "schema.yml"), resolve(staticDirectory, "schema.yml")),
]);

//#endregion

//#region Configuration

/**
 * Documentation site configuration for Docusaurus.
 * @satisfies {Partial<Config>}
 */
const config = {
    'title': 'whatever',
    themes: ["@docusaurus/theme-mermaid", "docusaurus-theme-openapi-docs"],
    themeConfig: /** @type {UserThemeConfig & UserThemeConfigExtra} */ ({
        navbarReplacements: {
            DOCS_URL: "/",
        },
        algolia: {
            appId: "36ROD0O0FV",
            apiKey: "727db511300ca9aec5425645bbbddfb5",
            indexName: "goauthentik",
            externalUrlRegex: new RegExp(
                "(:\\/\\/goauthentik\\.io|integrations\\.goauthentik\\.io)",
            ).toString(),
        },

        docs: {
            sidebar: {
                hideable: true,
            },
        },
    }),
    plugins: [
        [
            "./releases/plugin.mjs",
            /** @type {ReleasesPluginOptions} */ ({
                docsDirectory: join(__dirname, "docs"),
            }),
        ],

        [
            "@docusaurus/theme-classic",
            {
                customCss: require.resolve("@goauthentik/docusaurus-config/css/index.css"),
            },
        ],

        //#region API Docs

        [
            "@docusaurus/plugin-content-docs",
            /** @type {DocsPluginOptions} */ ({
                exclude: ["**/api/reference/**"],
                numberPrefixParser: false,
                id: "api",
                path: "api",
                routeBasePath: "api",
                sidebarPath: "api/sidebar.mjs",
                docItemComponent: "@theme/ApiItem",
            }),
        ],
        [
            "docusaurus-plugin-openapi-docs",
            {
                id: "open-api-docs",
                docsPluginId: "api",
                config: {
                    authentik: /** @type {OpenApiPlugin.Options} */ ({
                        template: "templates/api.mustache",
                        markdownGenerators: {
                            createApiPageMD: (pageData) => {
                                const {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    info,
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    postman,
                                    ...coreAPI
                                } = pageData.api;

                                return [
                                    createApiPageMD(pageData),
                                    `export const api = "${btoa(
                                        String.fromCharCode(
                                            ...gzip(JSON.stringify(coreAPI), {
                                                level: 9,
                                            }),
                                        ),
                                    )}";`,
                                ].join("\n");
                            },
                        },
                        specPath: "static/schema.yml",
                        outputDir: "api/reference",
                        hideSendButton: true,
                        disableCompression: true,
                        sidebarOptions: {
                            groupPathsBy: "tag",
                        },
                    }),
                },
            },
        ],

        //#region Documentation

        [
            "@docusaurus/plugin-content-docs",
            /** @type {DocsPluginOptions} */ ({
                exclude: [
                    // ---
                    ...GlobExcludeDefault,
                    "**/api/reference/**",
                ],
                id: "docs",
                routeBasePath: "/",
                path: "docs",
                sidebarPath: "./docs/sidebar.mjs",
                showLastUpdateTime: false,
                editUrl: "https://github.com/goauthentik/authentik/edit/main/website/",

                //#region Docs Plugins

                beforeDefaultRemarkPlugins: [
                    remarkDirective,
                    remarkLinkRewrite([
                        // ---
                        ["/integrations", "https://integrations.goauthentik.io"],
                    ]),
                    remarkVersionDirective,
                    remarkEnterpriseDirective,
                    remarkPreviewDirective,
                    remarkSupportDirective,
                ],

                remarkPlugins: [
                    [remarkNPM2Yarn, { sync: true }],
                    [
                        remarkGithub,
                        {
                            repository: "goauthentik/authentik",
                            /**
                             * @param {BuildUrlValues} values
                             */
                            buildUrl: (values) => {
                                // Only replace issues and PR links
                                return values.type === "issue" || values.type === "mention"
                                    ? defaultBuildUrl(values)
                                    : false;
                            },
                        },
                    ],
                ],
            }),
        ],
    ],
    //#endregion

    //#endregion
};

//#endregion

export default createDocusaurusConfig(config);
