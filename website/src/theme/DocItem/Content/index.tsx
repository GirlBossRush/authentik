import React, { type ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames } from "@docusaurus/theme-common";
import {
    DocContextValue,
    useDoc,
} from "@docusaurus/plugin-content-docs/client";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import type { Props } from "@theme/DocItem/Content";
import { DocFrontMatter } from "@docusaurus/plugin-content-docs";

/**
 * Title can be declared inside md content or declared through
 * front matter and added manually. To make both cases consistent,
 * the added title is added under the same div.markdown block
 * See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120
 *
 * We render a "synthetic title" if:
 * - user doesn't ask to hide it with front matter
 * - the markdown content does not already contain a top-level h1 heading
 */
function useSyntheticTitle(): string | null {
    const { metadata, frontMatter, contentTitle } = useDoc();
    const shouldRender =
        !frontMatter.hide_title && typeof contentTitle === "undefined";
    if (!shouldRender) {
        return null;
    }
    return metadata.title;
}

type SupportLevel = "authentik" | "community" | "deprecated";

interface SwizzledDocFrontMatter extends DocFrontMatter {
    support_level?: SupportLevel;
}

interface SwizzledDocContextValue extends DocContextValue {
    frontMatter: SwizzledDocFrontMatter;
}

const SupportLevelToLabel = new Map<SupportLevel, string>([
    ["authentik", "authentik"],
    ["community", "community"],
    ["deprecated", "deprecated"],
]);

const SupportLevelToBadgeClass = new Map<SupportLevel, string>([
    ["authentik", "badge--primary"],
    ["community", "badge--secondary"],
    ["deprecated", "badge--danger"],
]);

const SupportLevelBadge: React.FC = () => {
    const { frontMatter } = useDoc() as SwizzledDocContextValue;
    const { support_level } = frontMatter;

    if (!support_level || !SupportLevelToLabel.has(support_level)) {
        return null;
    }

    const label = SupportLevelToLabel.get(support_level);

    return (
        <span
            className={clsx(
                "badge",
                SupportLevelToBadgeClass.get(support_level),
            )}
        >
            Support level: {label}
        </span>
    );
};

export default function DocItemContent({ children }: Props): ReactNode {
    const syntheticTitle = useSyntheticTitle();

    return (
        <div className={clsx(ThemeClassNames.docs.docMarkdown, "markdown")}>
            {syntheticTitle && (
                <header>
                    <Heading as="h1">{syntheticTitle}</Heading>
                    <SupportLevelBadge />
                </header>
            )}
            <MDXContent>{children}</MDXContent>
        </div>
    );
}
