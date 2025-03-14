import type { ComponentProps, ReactNode } from "react";
import React, { useCallback } from "react";
import CodeBlock from "@theme/CodeBlock";
import CodeInline from "@theme/CodeInline";
import type { Props } from "@theme/MDXComponents/Code";

function shouldBeInline(props: Props) {
    return (
        // empty code blocks have no props.children,
        // see https://github.com/facebook/docusaurus/pull/9704
        typeof props.children !== "undefined" &&
        React.Children.toArray(props.children).every(
            (el) => typeof el === "string" && !el.includes("\n"),
        )
    );
}

export default function MDXCode(props: Props): ReactNode {
    const selectContent = useCallback<React.MouseEventHandler<HTMLElement>>(
        (event) => {
            const { currentTarget } = event;

            // Create a range and selection
            const range = document.createRange();
            const selection = window.getSelection();

            // Select the entire content of the code element
            range.selectNodeContents(currentTarget);

            // Clear any existing selections
            selection.removeAllRanges();

            // Add the new range to the selection
            selection.addRange(range);
        },
        [],
    );

    if (!shouldBeInline(props)) {
        return <CodeBlock {...(props as ComponentProps<typeof CodeBlock>)} />;
    }

    return <CodeInline {...props} onClick={selectContent} />;
}
