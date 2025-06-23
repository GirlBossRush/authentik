import Link from "@docusaurus/Link";
import isInternalUrl from "@docusaurus/isInternalUrl";
import { isActiveSidebarItem } from "@docusaurus/plugin-content-docs/client";
import { ThemeClassNames } from "@docusaurus/theme-common";
import type { Props } from "@theme/DocSidebarItem/Link";
import IconExternalLink from "@theme/Icon/ExternalLink";
import clsx from "clsx";
import React from "react";

import "./styles.css";

const DocSidebarItemLink: React.FC<Props> = ({
    item,
    onItemClick,
    activePath,
    level,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index,
    ...props
}) => {
    const { href, label, className, autoAddBaseUrl } = item;
    const isActive = isActiveSidebarItem(item, activePath);
    const isInternalLink = isInternalUrl(href);

    return (
        <li
            className={clsx(
                ThemeClassNames.docs.docSidebarItemLink,
                ThemeClassNames.docs.docSidebarItemLinkLevel(level),
                "menu__list-item",
                className,
            )}
            key={label}
        >
            <Link
                className={clsx("menu__link", {
                    "menu__link--external": !isInternalLink,
                    "menu__link--active": isActive,
                })}
                autoAddBaseUrl={autoAddBaseUrl}
                aria-current={isActive ? "page" : undefined}
                to={href}
                {...(isInternalLink && {
                    onClick: onItemClick ? () => onItemClick(item) : undefined,
                })}
                {...props}
            >
                {item.className?.includes("api-method") ? (
                    <div className="badge-container">
                        <span role="img" className="badge method" />
                    </div>
                ) : null}

                {label}
                {!isInternalLink && <IconExternalLink />}
            </Link>
        </li>
    );
};

export default DocSidebarItemLink;
